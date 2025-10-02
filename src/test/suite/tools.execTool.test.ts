import { execTool, ToolExecRequest, ToolExecResponse } from "../../tools/exec";
import * as execModule from "../../tools/exec";

describe("execTool", () => {
  const baseInput: ToolExecRequest = {
    toolName: "echo",
    params: { text: "hello" },
    sessionId: "session-1",
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns success and result for valid input", async () => {
    jest.spyOn(execModule as any, "executeToolAction").mockResolvedValue({
      toolName: "echo",
      params: { text: "hello" },
      output: "Stub result for tool: echo",
    });

    const result = await execTool(baseInput);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result.toolName).toBe("echo");
    expect(result.result.output).toMatch(/Stub result/);
  });

  it("returns error for invalid input (missing toolName)", async () => {
    const badInput = { ...baseInput, toolName: "" };
    const result = await execTool(badInput as any);
    expect(result.success).toBe(false);
    expect(result.result).toBeUndefined();
    expect(result.error).toMatch(/Invalid input/);
  });

  it("handles optional params and context fields", async () => {
    jest.spyOn(execModule as any, "executeToolAction").mockResolvedValue({
      toolName: "noop",
      output: "No params/context",
    });

    const input: ToolExecRequest = {
      toolName: "noop",
    };
    const result = await execTool(input);
    expect(result.success).toBe(true);
    expect(result.result.toolName).toBe("noop");
    expect(result.result.output).toBe("No params/context");
  });

  it("returns error if tool execution throws", async () => {
    jest.spyOn(execModule as any, "executeToolAction").mockImplementation(() => {
      throw new Error("Tool failed");
    });
    const result = await execTool(baseInput);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Tool failed/);
  });
});