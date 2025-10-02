/**
 * Dynamic toolset provider for LLM prompts.
 * A simple indirection so the LLM parser can fetch the latest enabled tools
 * from whichever MCP client is currently connected.
 */

export type DiscoveredTool = {
  name: string;
  description?: string;
  parameters?: Array<{ name?: string; type?: string; required?: boolean; [k: string]: any }>;
  [k: string]: any;
};


let fetcher: null | (() => Promise<DiscoveredTool[]>) = null;

/**
 * Register the async function used to fetch the current toolset.
 */
export function setToolsetFetcher(fn: () => Promise<DiscoveredTool[]>): void {
  fetcher = fn;
}
import { getActiveClient } from './clientRegistry';
import { buildJsonRpcRequest } from './jsonRpc';
import { getCachedTools } from './toolsetCache';
import { semanticSearch } from './semanticIndexer';

/**
 * Send a prompt to the MCP server and listen briefly for tools/* notifications
 * to collect the dynamically enabled toolset.
 *
 * Returns an empty array if no active client or if nothing is discovered.
 */
export async function getToolsetForPrompt(
  _userPrompt: string,
  _context: string = ''
): Promise<DiscoveredTool[]> {
  const client = getActiveClient();
  if (!client || typeof (client as any).sendJsonRpcRequest !== 'function') {
    return [];
  }

  let latestTools: DiscoveredTool[] = [];

  // Handler to capture tools update events
  const onToolsUpdate = (tools: any[]) => {
    if (Array.isArray(tools)) {
      latestTools = tools as DiscoveredTool[];
    }
  };

  // Attach listener
  try {
    (client as any).on?.('tools:update', onToolsUpdate);
  } catch {
    // ignore
  }

  try {
    // Dynamic prompt-triggered discovery is disabled to avoid noisy 'prompt' RPCs and reduce latency.
    // We now rely on semantic selection (external vector DB) or cached tools.
    // If a future server emits tools:update spontaneously, the listener above would capture it.
  } finally {
    // Detach listener
    try {
      (client as any).off?.('tools:update', onToolsUpdate);
    } catch {
      // ignore
    }
  }

  return Array.isArray(latestTools) ? latestTools : [];
}

/**
 * Ask the MCP server for a semantically selected tool subset for this prompt/context.
 * Tries several common JSON-RPC method names and parameter shapes.
 */
export async function getSemanticToolsetForPrompt(
  userPrompt: string,
  context: string = '',
  topK: number = 30
): Promise<DiscoveredTool[]> {
  const client = getActiveClient();
  if (!client || typeof (client as any).sendJsonRpcRequest !== 'function') {
    return [];
  }

  const normalizeResult = (res: any): any[] => {
    try {
      if (!res) return [];
      const arr = Array.isArray(res)
        ? res
        : (res.tools || res.toolset || res.items || res.available || null);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const tryCallStatus = async (method: string, params: any): Promise<{ arr: any[] | null; notFound: boolean }> => {
    try {
      const req = buildJsonRpcRequest(method, params);
      const result = await (client as any).sendJsonRpcRequest?.(req);
      const arr = normalizeResult(result);
      if (arr.length > 0) return { arr, notFound: false };
      return { arr: null, notFound: false };
    } catch (err: any) {
      // Detect "method not found" (-32601) or textual not found
      let code: any = undefined;
      let msg: string = '';
      try {
        code = (err && (err.code || err.error?.code));
        msg = (err && (err.message || err.error)) || '';
      } catch {}
      const body = typeof err === 'object' ? JSON.stringify(err) : String(err ?? '');
      const text = (msg || body).toLowerCase();
      const notFound = code === -32601 || (text.includes('not found') && text.includes('method')) || text.includes('method not found') || text.includes('does not exist');
      return { arr: null, notFound };
    }
  };

  // Candidate methods and param shapes
  const methods = ['tools/select', 'tools/search', 'toolsets/select', 'toolsets/query', 'tools/semantic'];
  const paramVariants = (
    q: string,
    c: string,
    k: number
  ) => [
    { query: q, context: c, topK: k },
    { prompt: q, context: c, limit: k },
    { text: q, context: c, k },
    { query: q, topK: k },
    { prompt: q, limit: k }
  ];

  for (const m of methods) {
    for (const p of paramVariants(userPrompt, context || '', topK)) {
      const { arr, notFound } = await tryCallStatus(m, p);
      if (arr && arr.length > 0) {
        return arr as DiscoveredTool[];
      }
      if (notFound) {
        // Do not try further parameter variants for this method name
        break;
      }
    }
  }

  return [];
}
/**
 * Get a semantically selected tool subset using external embedding/vector MCP servers.
 * Falls back to empty array if not configured or on error.
 */
export async function getSemanticToolsetExternal(
  userPrompt: string,
  topK: number = 30
): Promise<DiscoveredTool[]> {
  try {
    const cached = await getCachedTools();
    if (!Array.isArray(cached) || cached.length === 0) return [];

    // Ensure index exists/updated
    // Removed ensureSemanticIndex call as it is no longer needed

    // Run semantic search
    const hits = await semanticSearch(userPrompt, topK);
    if (!Array.isArray(hits) || hits.length === 0) return [];

    // Map by normalized name
    const norm = (s: any) => (typeof s === 'string' ? s : '')
      .replace(/^github\./, '')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();

    const byName = new Map<string, any>();
    for (const t of cached as any[]) {
      const n = norm(t?.name);
      if (n) byName.set(n, t);
    }

    const out: any[] = [];
    for (const h of hits) {
      const n = norm(h.id || h.metadata?.name || '');
      const t = byName.get(n);
      if (t) out.push(t);
      if (out.length >= topK) break;
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Get the current dynamically-discovered toolset.
 * Returns an empty array if no fetcher is registered or on error.
 */
export async function getToolset(): Promise<DiscoveredTool[]> {
  try {
    if (!fetcher) return [];
    const tools = await fetcher();
    // Ensure array return
    if (Array.isArray(tools)) return tools;
    return [];
  } catch {
    return [];
  }
}
