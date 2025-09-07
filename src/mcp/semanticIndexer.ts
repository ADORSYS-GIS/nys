import axios from 'axios';
import * as vscode from 'vscode';
import { buildJsonRpcRequest } from './jsonRpc';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

export type ToolDoc = {
  id: string; // normalized tool name
  text: string; // description + params flattened
  metadata?: Record<string, any>;
};

export type VectorHit = {
  id: string;
  score?: number;
  metadata?: Record<string, any>;
};

// Simple in-memory cache to avoid re-indexing too often within a session
let lastNamespaceSignature: string | null = null;
let lastIndexedAt = 0;

// LangChain in-memory vector store per namespace (replaces Milvus by default)
const _memStores: Map<string, MemoryVectorStore> = new Map();

// Lightweight embeddings adapter that reuses existing tryEmbed() logic.
// This avoids requiring users to configure separate LangChain embedding providers.
const _embeddingsAdapter: any = {
  embedDocuments: async (texts: string[]): Promise<number[][]> => {
    const { embeddingUrl } = getConfig() as any;
    return await tryEmbed(embeddingUrl, texts.map(t => String(t ?? '')));
  },
  embedQuery: async (text: string): Promise<number[]> => {
    const { embeddingUrl } = getConfig() as any;
    const [v] = await tryEmbed(embeddingUrl, [String(text ?? '')]);
    return Array.isArray(v) ? v : [];
  }
};

import { getMergedConfig, hasExternalOverride } from '../config/configLoader';
function getConfig() {
  const merged = (getMergedConfig('mcpClient') || {}) as any;
  const cfg = !hasExternalOverride() ? vscode.workspace.getConfiguration('mcpClient') : undefined;
  const pick = <T>(key: string, def: T): T => (
    (merged[key] !== undefined)
      ? (merged[key] as T)
      : (cfg ? (cfg.get<T>(key, def) as T) : def)
  );
  return {
    embeddingUrl: pick<string>('embeddingServerUrl', ''),
    vectorUrl: pick<string>('vectorServerUrl', ''),
    namespace: pick<string>('semanticNamespace', 'github-tools') || 'github-tools',
    topK: pick<number>('semanticTopK', 30) || 30,
    embProvider: String(pick<string>('embeddingProvider', 'openai') || 'openai').toLowerCase(),
    embModel: pick<string>('embeddingModelName', '') || '',
    embApiKey: pick<string>('embeddingApiKey', '')
      || pick<string>('llmApiKey', '')
      || pick<string>('apiKey', '')
      || '',
    milvusAddress: pick<string>('milvusAddress', '') || '',
    milvusUsername: pick<string>('milvusUsername', 'root') || 'root',
    milvusPassword: pick<string>('milvusPassword', '') || '',
    milvusUseSSL: !!pick<boolean>('milvusUseSSL', false),
    milvusCollectionPrefix: pick<string>('milvusCollectionPrefix', 'tools_') || 'tools_',
    // Docker autostart options
    milvusStartDocker: !!pick<boolean>('milvusStartDocker', false),
    milvusDockerComposeFile: pick<string>('milvusDockerComposeFile', ''),
    milvusDockerImage: pick<string>('milvusDockerImage', 'milvusdb/milvus:v2.4.3-standalone'),
    milvusContainerName: pick<string>('milvusContainerName', 'milvus-standalone'),
    // Optional wait time
    milvusWaitSeconds: pick<number>('milvusWaitSeconds', 180),
  } as any;
}

function normalizeName(n: any): string {
  const raw = typeof n === 'string' ? n : '';
  return raw.replace(/^github\./, '').replace(/^_+|_+$/g, '').toLowerCase();
}

function toolsetSignature(namespace: string, tools: any[]): string {
  try {
    const ids = (tools || [])
      .map(t => normalizeName(t?.name))
      .filter(Boolean)
      .sort()
      .join('|');
    return `${namespace}::${ids}`;
  } catch {
    return `${namespace}::unknown`;
  }
}

function buildDocumentsFromTools(tools: any[]): ToolDoc[] {
  const docs: ToolDoc[] = [];
  for (const t of Array.isArray(tools) ? tools : []) {
    const name = normalizeName(t?.name);
    if (!name) continue;
    const descRaw = typeof t?.description === 'string' ? t.description : '';
    const desc = descRaw.length > 512 ? (descRaw.slice(0, 512) + '…') : descRaw;
    const p = (t && (t.parameters || t.args || t.inputs)) || [];
    let paramsText = '';
    if (Array.isArray(p)) {
      const kv = p
        .map((x: any) => x && typeof x.name === 'string' ? `${x.name}:${x.type || ''}` : '')
        .filter(Boolean)
        .join(', ');
      if (kv) paramsText = `\nparams: ${kv.slice(0, 256)}`;
    } else if (p && typeof p === 'object') {
      const props = (p as any).properties || (p as any).schema?.properties || {};
      const kv = Object.keys(props)
        .map(k => `${k}:${(props as any)[k]?.type || ''}`)
        .join(', ');
      if (kv) paramsText = `\nparams: ${kv.slice(0, 256)}`;
    }
    const text = `tool: ${name}\n${desc}${paramsText}`.trim();
    docs.push({ id: name, text, metadata: { name, description: desc } });
  }
  return docs;
}

async function callJsonRpc(url: string, method: string, params: any): Promise<any> {
  const req = buildJsonRpcRequest(method, params);
  const resp = await axios.post(url, req, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
  // Accept both {result} and direct arrays/objects
  if (resp && resp.data && typeof resp.data === 'object') {
    if ('result' in resp.data) return (resp.data as any).result;
    return resp.data;
  }
  return resp.data;
}

async function tryEmbed(embeddingUrl: string, inputs: string[]): Promise<number[][]> {
  // If an Embedding MCP server URL is configured, use it first (backward compatible)
  if (embeddingUrl && embeddingUrl.trim().length > 0) {
    const candidates = [
      { method: 'embeddings/create', params: { input: inputs } },
      { method: 'embed', params: { input: inputs } },
      { method: 'text/embedding', params: { texts: inputs } },
    ];
    for (const c of candidates) {
      try {
        const result = await callJsonRpc(embeddingUrl, c.method, c.params);
        // Normalize common shapes
        if (Array.isArray(result)) {
          if (Array.isArray(result[0])) return result as number[][];
        }
        const data = result?.data || result?.embeddings || result?.items || result;
        if (Array.isArray(data)) {
          const vectors: number[][] = [];
          for (const item of data) {
            if (Array.isArray(item)) {
              vectors.push(item as number[]);
            } else if (item && (Array.isArray(item.embedding) || Array.isArray(item.vector))) {
              vectors.push((item.embedding || item.vector) as number[]);
            }
          }
          if (vectors.length === inputs.length) return vectors;
          if (vectors.length > 0) return vectors; // best effort
        }
      } catch {
        // try next shape
      }
    }
    throw new Error('Failed to embed inputs via embedding MCP server');
  }

  // Otherwise, use a local provider (OpenAI/Gemini/Anthropic) to generate embeddings directly
  const { embProvider, embModel, embApiKey } = getConfig() as any;
  if (!embApiKey) {
    throw new Error('No embedding API key found. Set mcpClient.embeddingApiKey (or llmApiKey/apiKey).');
  }

  const provider = (typeof embProvider === 'string' ? embProvider : 'openai').toLowerCase();

  if (provider === 'openai') {
    const model = embModel && embModel.trim() ? embModel.trim() : 'text-embedding-3-small';
    const client = new OpenAI({ apiKey: embApiKey });
    // Use single batched call
    const resp = await client.embeddings.create({ model, input: inputs });
    const data: any[] = (resp as any)?.data || [];
    const vectors: number[][] = [];
    for (const item of data) {
      if (Array.isArray(item?.embedding)) vectors.push(item.embedding as number[]);
    }
    if (vectors.length === 0) throw new Error('OpenAI embeddings returned no vectors');
    return vectors;
  }

  if (provider === 'gemini') {
    const modelName = embModel && embModel.trim() ? embModel.trim() : 'text-embedding-004';
    const genAI = new GoogleGenerativeAI(embApiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const vectors: number[][] = [];
    for (const text of inputs) {
      try {
        // Simpler, type-safe form: pass text directly
        const res: any = await model.embedContent(String(text ?? ''));
        const vals: number[] = res?.embedding?.values || [];
        if (Array.isArray(vals) && vals.length > 0) vectors.push(vals);
      } catch {
        // skip this input but continue
      }
    }
    if (vectors.length === 0) throw new Error('Gemini embeddings returned no vectors');
    return vectors;
  }

  // Anthropic does not provide a public embeddings API in this extension context
  throw new Error('Embedding provider "anthropic" is not supported. Use openai or gemini, or configure embeddingServerUrl.');
}

async function tryUpsertVectors(vectorUrl: string, namespace: string, docs: ToolDoc[], vectors: number[][]): Promise<void> {
  const records = docs.map((d, i) => ({ id: d.id, values: vectors[i], metadata: d.metadata || {} }));
  const candidates = [
    { method: 'vectors/upsert', params: { namespace, vectors: records } },
    { method: 'index/upsert', params: { namespace, items: records } },
    { method: 'upsert', params: { namespace, vectors: records } },
  ];
  for (const c of candidates) {
    try {
      await callJsonRpc(vectorUrl, c.method, c.params);
      return;
    } catch {
      // try next
    }
  }
  throw new Error('Failed to upsert vectors into Vector MCP server');
}

async function tryQueryVectors(vectorUrl: string, namespace: string, queryVector: number[], topK: number): Promise<VectorHit[]> {
  const candidates = [
    { method: 'vectors/query', params: { namespace, vector: queryVector, topK } },
    { method: 'index/query', params: { namespace, vector: queryVector, k: topK } },
    { method: 'query', params: { namespace, vector: queryVector, topK } },
  ];
  for (const c of candidates) {
    try {
      const res = await callJsonRpc(vectorUrl, c.method, c.params);
      const items = res?.matches || res?.results || res?.items || res?.vectors || res;
      const out: VectorHit[] = [];
      if (Array.isArray(items)) {
        for (const it of items) {
          const id = it?.id || it?.metadata?.id || it?.name || '';
          if (!id) continue;
          out.push({ id: String(id), score: typeof it?.score === 'number' ? it.score : undefined, metadata: it?.metadata || undefined });
        }
      }
      if (out.length > 0) return out;
    } catch {
      // try next
    }
  }
  return [];
}

import { ensureMilvusStarted } from './milvusStarter';
// Milvus helpers (dynamic load to avoid compile-time issues when not installed)
let _milvusClient: any = null;
let _milvusEverReady = false;
function normalizeMilvusAddress(addr: string): string {
  try {
    if (!addr) return '';
    return String(addr).replace(/^grpc:\/\//, '').replace(/^http[s]?:\/\//, '');
  } catch { return String(addr || ''); }
}
async function getMilvusClient(): Promise<any> {
  if (_milvusClient) return _milvusClient;
  try {
    // Prefer official milvus-io/milvus-sdk-node, fallback to @zilliz/milvus2-sdk-node
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let milvus: any = null;
    let sdkName = '';
    try {
      milvus = require('milvus-sdk-node');
      sdkName = 'milvus-sdk-node';
    } catch {
      try {
        milvus = require('@zilliz/milvus2-sdk-node');
        sdkName = '@zilliz/milvus2-sdk-node';
      } catch {
        milvus = null;
      }
    }
    const { milvusAddress, milvusUseSSL, milvusUsername, milvusPassword } = getConfig() as any;
    if (!milvusAddress || !milvus) return null;
    const addr = normalizeMilvusAddress(milvusAddress);
    const client = new milvus.MilvusClient({
      address: addr,
      ssl: !!milvusUseSSL,
      username: milvusUsername || 'root',
      password: milvusPassword || ''
    });
    try { console.log(`[Semantic][Milvus] Using SDK=${sdkName} address=${addr} (raw=${milvusAddress}) ssl=${!!milvusUseSSL} user=${milvusUsername || 'root'}`); } catch {}
    _milvusClient = client;
    return _milvusClient;
  } catch (e) {
    try { console.warn('[Semantic][Milvus] Failed to initialize Milvus client:', e); } catch {}
    return null;
  }
}

async function waitForMilvusReady(client: any, timeoutSeconds: number): Promise<void> {
  const deadline = Date.now() + Math.max(0, (Number(timeoutSeconds) || 0)) * 1000;
  while (Date.now() < deadline) {
    // Prefer explicit health API if present
    try {
      if (typeof (client as any).checkHealth === 'function') {
        const h: any = await (client as any).checkHealth();
        const ok = h?.isHealthy === true || h?.status === 'Healthy' || h?.code === 0 || h === true;
        if (ok) return;
      }
    } catch {}
    // Try getVersion if available
    try {
      if (typeof (client as any).getVersion === 'function') {
        const v: any = await (client as any).getVersion();
        if (v) return;
      }
    } catch {}
    // Fallback: a lightweight list call
    try {
      if (typeof (client as any).showCollections === 'function') {
        await (client as any).showCollections();
        return;
      }
    } catch {}
    await sleep(500);
  }
}

function sanitizeCollectionName(name: string): string {
  return String(name || '').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 64);
}

async function ensureMilvusCollection(client: any, collectionName: string, dim: number): Promise<void> {
  try {
    const collections = await client.showCollections?.();
    const exists = Array.isArray(collections?.data)
      ? collections.data.some((c: any) => (c.collection_name || c.name) === collectionName)
      : false;
    try { console.log(`[Semantic][Milvus] Collection ${collectionName} exists=${exists}`); } catch {}
    if (!exists) {
      const DataType = (client as any).DataType
        || (function(){ try { return (require('milvus-sdk-node') as any).DataType; } catch { try { return (require('@zilliz/milvus2-sdk-node') as any).DataType; } catch { return undefined; } } })();
      const fields = [
        { name: 'id', data_type: DataType.VarChar, is_primary_key: true, max_length: 256 },
        { name: 'vector', data_type: DataType.FloatVector, dim },
        { name: 'name', data_type: DataType.VarChar, max_length: 512 },
        { name: 'description', data_type: DataType.VarChar, max_length: 2048 }
      ];
      await client.createCollection({ collection_name: collectionName, fields });
      try { console.log(`[Semantic][Milvus] Created collection ${collectionName} (dim=${dim})`); } catch {}
    }
  } catch (e) { try { console.warn('[Semantic][Milvus] ensureMilvusCollection show/create failed:', e); } catch {} }
  // Create index if not present and load
  try {
    await client.createIndex({
      collection_name: collectionName,
      field_name: 'vector',
      index_name: 'hnsw_vector',
      index_type: 'HNSW',
      metric_type: 'COSINE',
      params: { M: 16, efConstruction: 200 }
    });
    try { console.log(`[Semantic][Milvus] Created/ensured index hnsw_vector on ${collectionName}`); } catch {}
  } catch (e) { try { console.warn('[Semantic][Milvus] createIndex failed (may already exist):', e); } catch {} }
  try {
    await client.loadCollection({ collection_name: collectionName });
    try { console.log(`[Semantic][Milvus] Loaded collection ${collectionName}`); } catch {}
  } catch (e) { try { console.warn('[Semantic][Milvus] loadCollection failed:', e); } catch {} }
}

async function milvusDeleteByIds(client: any, collectionName: string, ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  const quoted = ids.map((s) => `"${String(s).replace(/"/g, '')}"`).join(',');
  const expr = `id in [${quoted}]`;
  // Try newer/alt SDK: delete, then fallback to deleteEntities
  try {
    await (client as any).delete?.({ collection_name: collectionName, expr });
    return;
  } catch {}
  try {
    await (client as any).deleteEntities?.({ collection_name: collectionName, expr });
  } catch {}
}

async function milvusInsert(client: any, collectionName: string, docs: ToolDoc[], vectors: number[][]): Promise<void> {
  const rows = docs.map((d, i) => ({ id: d.id, name: d.metadata?.name || d.id, description: d.metadata?.description || '', vector: vectors[i] }));
  // Try newer SDK shape first: data: rows; then fallback to fields_data: rows
  try {
    await client.insert({ collection_name: collectionName, data: rows });
    return;
  } catch {}
  try {
    await client.insert({ collection_name: collectionName, fields_data: rows });
  } catch {}
}

async function milvusSearch(client: any, collectionName: string, vector: number[], topK: number): Promise<VectorHit[]> {
  // Try multiple request shapes to handle SDK differences
  const attempts: any[] = [
    {
      collection_name: collectionName,
      data: [vector],
      anns_field: 'vector',
      output_fields: ['id', 'name'],
      top_k: topK,
      metric_type: 'COSINE',
      params: { ef: 128 }
    },
    {
      collection_name: collectionName,
      vectors: [vector],
      anns_field: 'vector',
      output_fields: ['id', 'name'],
      top_k: topK,
      metric_type: 'COSINE',
      params: { ef: 128 }
    },
    {
      collection_name: collectionName,
      data: [vector],
      anns_field: 'vector',
      output_fields: ['id', 'name'],
      topk: topK,
      metric_type: 'COSINE',
      params: { ef: 128 }
    }
  ];

  for (const req of attempts) {
    try {
      const res = await client.search(req);
      try { console.log(`[Semantic][Milvus] Raw search response keys: ${Object.keys(res || {}).join(', ')}`); } catch {}

      // Normalize result shapes
      const raw: any = res as any;
      let items: any[] = [];
      const cand: any = raw?.results ?? raw?.data ?? raw;

      if (Array.isArray(cand)) {
        items = Array.isArray(cand[0]) ? (cand[0] as any[]) : (cand as any[]);
      } else if (cand && Array.isArray(cand.results)) {
        const r0 = cand.results;
        items = Array.isArray(r0[0]) ? (r0[0] as any[]) : (r0 as any[]);
      } else if (cand && Array.isArray(cand.hits)) {
        items = cand.hits as any[];
      }

      const out: VectorHit[] = [];
      for (const r of items) {
        const id = r?.id || r?.entity?.id || r?.name || r?.fields?.id || r?.fields?.[0]?.id || r?.pk || r?.primary_key || '';
        if (!id) continue;
        const score = typeof r?.score === 'number' ? r.score : (typeof r?.distance === 'number' ? r.distance : undefined);
        out.push({ id: String(id), score });
      }
      if (out.length > 0) return out;
    } catch (e) {
      // try next shape
    }
  }
  try { console.warn('[Semantic][Milvus] All search request shapes failed or returned empty.'); } catch {}
  return [];
}

export async function ensureSemanticIndex(tools: any[]): Promise<void> {
  const cfg = getConfig() as any;
  const { namespace } = cfg;

  const docs = buildDocumentsFromTools(tools);
  if (docs.length === 0) return;

  const sig = toolsetSignature(namespace, tools);
  const now = Date.now();
  // Only re-index when the toolset signature changes (e.g., on connection with new tools).
  if (lastNamespaceSignature === sig) {
    try { console.log(`[Semantic][Index] Skipping re-index (no changes) for namespace=${namespace}`); } catch {}
    return;
  }

  // Build/replace in-memory vector store using LangChain and our embedding adapter (no external DB)
  try {
    const texts = docs.map(d => d.text.length > 800 ? d.text.slice(0, 800) + '…' : d.text);
    const metadatas = docs.map(d => ({ id: d.id, name: d.metadata?.name || d.id, description: d.metadata?.description || '' }));
    const store = await MemoryVectorStore.fromTexts(texts, metadatas, _embeddingsAdapter);
    _memStores.set(namespace, store);
    lastNamespaceSignature = sig;
    lastIndexedAt = now;
    try { console.log(`[Semantic][Index][Memory] Indexed ${docs.length} docs for namespace=${namespace}`); } catch {}
    return;
  } catch (e) {
    try { console.warn('[Semantic][Index][Memory] Failed to build in-memory index:', e); } catch {}
    // If memory index fails, we simply do not index; callers will fallback gracefully.
    return;
  }

}

export async function semanticSearch(query: string, context: string = '', topK?: number): Promise<VectorHit[]> {
  const cfg = getConfig() as any;
  const { namespace, topK: cfgTopK } = cfg;
  const k = Math.max(1, typeof topK === 'number' && topK > 0 ? topK : cfgTopK);

  // Build query text
  const fullQuery = [query || ''];
  const ctx = typeof context === 'string' ? context.trim() : '';
  if (ctx) fullQuery.push(ctx.slice(0, 4000));
  const qText = fullQuery.join('\n\n');

  // Memory vector store first (default)
  const store = _memStores.get(namespace);
  if (store) {
    try {
      const qVec = await _embeddingsAdapter.embedQuery(qText);
      if (Array.isArray(qVec) && qVec.length > 0) {
        const pairs = await (store as any).similaritySearchVectorWithScore(qVec, k);
        const out: VectorHit[] = [];
        for (const p of (pairs || [])) {
          const doc: any = p && Array.isArray(p) ? p[0] : null;
          const score: any = p && Array.isArray(p) ? p[1] : undefined;
          const id = doc?.metadata?.id || doc?.metadata?.name || '';
          if (!id) continue;
          out.push({ id: String(id), score: typeof score === 'number' ? score : undefined, metadata: doc?.metadata || undefined });
        }
        try { console.log(`[Semantic][Search][Memory] namespace=${namespace} hits=${out.length}`); } catch {}
        return out;
      }
    } catch (e) {
      try { console.warn('[Semantic][Search][Memory] failed:', e); } catch {}
    }
  }

  // No memory index available; nothing to return
  return [];
}
