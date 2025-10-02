// Semantic Indexer for Mira Extension using LangChain and persistent vector store

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import * as fs from "fs";
import * as path from "path";

// Type for a code/document chunk
export type Chunk = {
  id: string;
  content: string;
  metadata?: Record<string, any>;
};

const VECTORSTORE_PATH = path.join(
  process.cwd(),
  ".nys",
  "vectorstore.json"
);

let vectorStore: MemoryVectorStore | null = null;
let chunks: Chunk[] = [];

// Utility: Ensure .nys directory exists
function ensureNysDir() {
  const dir = path.dirname(VECTORSTORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Utility: Save vector store and chunks to disk
async function saveVectorStore() {
  ensureNysDir();
  // Save both the vector store's internal state and the chunks
  const data = {
    vectorStore: await (vectorStore as any).toJSON(),
    chunks,
  };
  fs.writeFileSync(VECTORSTORE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Utility: Load vector store and chunks from disk
async function loadVectorStore() {
  if (!fs.existsSync(VECTORSTORE_PATH)) return false;
  const raw = fs.readFileSync(VECTORSTORE_PATH, "utf-8");
  const data = JSON.parse(raw);
  if (!data || !data.chunks) return false;
  chunks = data.chunks;
  // Re-embed all chunks to reconstruct the vector store
  const texts = chunks.map((c: Chunk) => c.content);
  const metadatas = chunks.map((c: Chunk) => c.metadata || {});
  vectorStore = await MemoryVectorStore.fromTexts(
    texts,
    metadatas,
    new OpenAIEmbeddings()
  );
  return true;
}

// Index all files: split into chunks, embed, and store
export async function indexFiles(fileContents: { id: string; content: string; metadata?: Record<string, any> }[]) {
  // Split all files into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const allChunks: Chunk[] = [];
  for (const file of fileContents) {
    const splits = await splitter.splitText(file.content);
    for (let i = 0; i < splits.length; ++i) {
      allChunks.push({
        id: `${file.id}::chunk${i}`,
        content: splits[i],
        metadata: { ...(file.metadata || {}), fileId: file.id, chunkIndex: i },
      });
    }
  }
  chunks = allChunks;

  // Prepare for vector store
  const texts = chunks.map((c) => c.content);
  const metadatas = chunks.map((c) => c.metadata || {});

  // Use OpenAIEmbeddings (can be swapped for other providers)
  vectorStore = await MemoryVectorStore.fromTexts(
    texts,
    metadatas,
    new OpenAIEmbeddings()
  );

  await saveVectorStore();
}

// Semantic search: return top-k relevant chunks for a query
export async function semanticSearch(query: string, k: number): Promise<Chunk[]> {
  if (!vectorStore || chunks.length === 0) {
    const loaded = await loadVectorStore();
    if (!loaded) return [];
  }
  // Get top-k results with scores
  const results = await (vectorStore as any).similaritySearchWithScore(query, k);
  // results: Array<[Document, score]>
  const out: Chunk[] = [];
  for (const [doc, score] of results) {
    // Find the chunk by metadata
    const fileId = doc.metadata?.fileId;
    const chunkIndex = doc.metadata?.chunkIndex;
    const chunk = chunks.find(
      (c) => c.metadata?.fileId === fileId && c.metadata?.chunkIndex === chunkIndex
    );
    if (chunk) {
      out.push({ ...chunk, metadata: { ...chunk.metadata, score } });
    }
  }
  return out;
}
