import { PlanningChain } from "../../orchestrator/langchainEngine";
import { expect } from "chai";

describe("Planner Integration", () => {
  it("should generate a step-by-step plan for a goal", async () => {
    // Use a mock LLM that returns a canned plan
    const mockLLM = {
      call: async ({ goal }: { goal: string }) => ({ text: `plan: ${goal}` })
    };
    const planner = new PlanningChain(mockLLM);
    const result = await planner.plan("Build a todo app");
    expect(result).to.include("plan: Build a todo app");
  });

  it("should handle empty goals gracefully", async () => {
    const mockLLM = {
      call: async () => ({ text: "" })
    };
    const planner = new PlanningChain(mockLLM);
    const result = await planner.plan("");
    expect(result).to.equal("");
  });
});