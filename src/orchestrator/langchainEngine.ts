import {
  ChatOpenAI,
  ChatAnthropic,
  ChatGoogle,
  BaseChatMemory,
  ChatMessageHistory,
  MemoryVectorStore,
  RecursiveCharacterTextSplitter,
  OpenAIEmbeddings,
  ConversationChain,
  LLMChain,
  PromptTemplate
} from "../test/__mocks__/langchain";
import { ConfigManager } from "../config/configManager";

function serializeChatHistory(chatHistory: ChatMessageHistory) {
  // Use public method to get all messages as array
  if (typeof (chatHistory as any).toJSON === "function") {
    return (chatHistory as any).toJSON();
  }
  // Fallback: try to access messages if available
  return (chatHistory as any).messages || [];
}

function deserializeChatHistory(data: any): ChatMessageHistory {
  const history = new ChatMessageHistory();
  if (Array.isArray(data)) {
    for (const msg of data) {
      if (msg.type === "human") {
        history.addUserMessage(msg.data?.content || msg.content);
      } else if (msg.type === "ai") {
        history.addAIChatMessage(msg.data?.content || msg.content);
      }
    }
  }
  return history;
}

import * as fs from "fs";
import * as path from "path";
const MEMORY_PATH = path.join(process.cwd(), ".nys", "memory.json");

export class PersistentChatMemory extends BaseChatMemory {
  constructor(fields: any = {}) {
    // Synchronous load for constructor (required for super)
    let chatHistory = undefined;
    if (fs.existsSync(MEMORY_PATH)) {
      try {
        const data = JSON.parse(fs.readFileSync(MEMORY_PATH, "utf-8"));
        chatHistory = deserializeChatHistory(data);
      } catch (e) {
        chatHistory = new ChatMessageHistory();
      }
    } else {
      chatHistory = new ChatMessageHistory();
    }
    super({ ...fields, chatHistory });
  }

  get memoryKeys(): string[] {
    // Return the keys used for memory variables
    return ["chat_history"];
  }

  async loadMemoryVariables(): Promise<any> {
    // Return the chat history as a memory variable
    return { chat_history: this.chatHistory };
  }

  async save() {
    // Ensure we serialize only if chatHistory has getMessages
    await ConfigManager.writeState(
      "memory.json",
      typeof (this.chatHistory as any).getMessages === "function"
        ? (this.chatHistory as any).getMessages()
        : []
    );
  }

  async saveContext(inputValues: any, outputValues: any) {
    await super.saveContext(inputValues, outputValues);
    await this.save();
  }

  async clear() {
    await super.clear();
    await this.save();
  }
}

export class ChatChain {
  private chain: ConversationChain;
  private memory: PersistentChatMemory;

  constructor(llm: any) {
    this.memory = new PersistentChatMemory();
    this.chain = new ConversationChain({
      llm,
      memory: this.memory,
    });
  }

  async call(input: string, context: any = {}) {
    const result = await this.chain.call({ input, ...context });
    this.memory.save();
    return result;
  }

  getMemory() {
    return this.memory;
  }
}

export class PlanningChain {
  private chain: LLMChain;

  constructor(llm: any) {
    const prompt = PromptTemplate.fromTemplate(
      "You are a project planner. Given the user's goal, output a step-by-step task outline.\n\nGoal: {goal}\n\nTask Outline:"
    );
    this.chain = new LLMChain({ llm, prompt });
  }

  async plan(goal: string) {
    const result = await this.chain.call({ goal });
    return result.text || result;
  }
}

export class RAGChain {
  private vectorStore: MemoryVectorStore;
  private splitter: RecursiveCharacterTextSplitter;
  private llm: any;

  constructor(llm: any) {
    this.llm = llm;
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    this.vectorStore = new MemoryVectorStore();
  }

  async indexFiles(fileContents: { path: string; content: string }[]) {
    const docs = [];
    for (const file of fileContents) {
      const splits = await this.splitter.splitText(file.content);
      for (const chunk of splits) {
        docs.push({
          pageContent: chunk,
          metadata: { source: file.path },
        });
      }
    }
    await this.vectorStore.addDocuments(docs);
  }

  async query(query: string, topK = 5) {
    const results = await this.vectorStore.similaritySearch(query, topK);
    return results.map((doc: any) => ({
      content: doc.pageContent,
      source: doc.metadata?.source,
    }));
  }
}

// Factory for LLMs using LangChain wrappers
export function getLangChainLLM(provider: "openai" | "anthropic" | "google", _apiKey: string, _modelName?: string) {
  switch (provider) {
    case "openai":
      return new ChatOpenAI();
    case "anthropic":
      return new ChatAnthropic();
    case "google":
      return new ChatGoogle();
    default:
      throw new Error("Unsupported provider: " + provider);
  }
}