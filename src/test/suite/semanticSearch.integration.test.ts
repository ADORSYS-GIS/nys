import { RAGChain } from "../../orchestrator/langchainEngine";
import { expect } from "chai";

describe("Semantic Search Integration", () => {
  it("should index files and return relevant chunks for a query", async () => {
    const mockLLM = {};
    const rag = new RAGChain(mockLLM);

    await rag.indexFiles([
      { path: "file1.txt", content: "The quick brown fox jumps over the lazy dog." },
      { path: "file2.txt", content: "Semantic search enables retrieval of relevant information." }
    ]);

    const results = await rag.query("fox", 2);
    expect(results).to.be.an("array");
    expect(results[0].content).to.include("fox");
    expect(results[0].source).to.equal("file1.txt");
  });

  it("should return empty array if no relevant chunks found", async () => {
    const mockLLM = {};
    const rag = new RAGChain(mockLLM);

    await rag.indexFiles([
      { path: "file1.txt", content: "Completely unrelated content." }
    ]);

    const results = await rag.query("nonexistent", 2);
    expect(results).to.be.an("array").that.is.empty;
  });
});