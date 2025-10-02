// Mocks for LangChain classes for fast unit/integration tests

export class ChatOpenAI {
  constructor() {}
  call() { return Promise.resolve({ text: "mocked openai response" }); }
}
export class ChatAnthropic {
  constructor() {}
  call() { return Promise.resolve({ text: "mocked anthropic response" }); }
}
export class ChatGoogle {
  constructor() {}
  call() { return Promise.resolve({ text: "mocked google response" }); }
}
export class BaseChatMemory {
  chatHistory: any[] = [];
  constructor(fields: any = {}) {
    this.chatHistory = fields.chatHistory || [];
  }
  async saveContext(inputValues: any, outputValues: any) {
    this.chatHistory.push({ inputValues, outputValues });
  }
  async clear() {
    this.chatHistory = [];
  }
  async loadMemoryVariables() {
    return { chat_history: this.chatHistory };
  }
}
export class ChatMessageHistory {
  messages: any[] = [];
  addUserMessage(msg: string) { this.messages.push({ type: "human", content: msg }); }
  addAIChatMessage(msg: string) { this.messages.push({ type: "ai", content: msg }); }
  toJSON() { return this.messages; }
  getMessages() { return this.messages; }
}
export class MemoryVectorStore {
  docs: any[] = [];
  constructor() {}
  async addDocuments(docs: any[]) { this.docs.push(...docs); }
  async similaritySearch(_query: string, topK: number) {
    return this.docs.slice(0, topK).map(doc => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata
    }));
  }
}
export class RecursiveCharacterTextSplitter {
  chunkSize: number;
  chunkOverlap: number;
  constructor({ chunkSize, chunkOverlap }: { chunkSize: number, chunkOverlap: number }) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }
  async splitText(text: string) {
    // Simple mock: split by chunkSize
    const chunks = [];
    for (let i = 0; i < text.length; i += this.chunkSize) {
      chunks.push(text.slice(i, i + this.chunkSize));
    }
    return chunks;
  }
}
export class OpenAIEmbeddings {
  constructor() {}
}
export class ConversationChain {
  llm: any;
  memory: any;
  constructor({ llm, memory }: { llm: any, memory: any }) {
    this.llm = llm;
    this.memory = memory;
  }
  async call({ input }: { input: string }) {
    return { response: `conversation: ${input}` };
  }
}
export class LLMChain {
  llm: any;
  prompt: any;
  constructor({ llm, prompt }: { llm: any, prompt: any }) {
    this.llm = llm;
    this.prompt = prompt;
  }
  async call({ goal }: { goal: string }) {
    return { text: `plan: ${goal}` };
  }
}
export class PromptTemplate {
  static fromTemplate(template: string) {
    return { template };
  }
}