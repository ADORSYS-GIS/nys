import { PersistentChatMemory } from "../../orchestrator/langchainEngine";

// Use the mock ChatMessageHistory and BaseChatMemory from __mocks__
jest.mock("langchain/memory/chat_memory");
jest.mock("langchain/stores/message/in_memory");

describe("Chat Memory Integration", () => {
  it("should persist and reload chat history", async () => {
    const memory = new PersistentChatMemory();
    await memory.saveContext({ input: "Hello" }, { output: "Hi there!" });
    await memory.saveContext({ input: "How are you?" }, { output: "I'm fine." });

    // Simulate saving and reloading
    await memory.save();
    const reloaded = new PersistentChatMemory();
    const vars = await reloaded.loadMemoryVariables({});
    expect(vars.chat_history.length).toBeGreaterThanOrEqual(2);
    expect(vars.chat_history[0].inputValues.input).toBe("Hello");
    expect(vars.chat_history[1].outputValues.output).toBe("I'm fine.");
  });

  it("should clear chat history", async () => {
    const memory = new PersistentChatMemory();
    await memory.saveContext({ input: "Test" }, { output: "Tested" });
    await memory.clear();
    const vars = await memory.loadMemoryVariables({});
    expect(vars.chat_history.length).toBe(0);
  });
});