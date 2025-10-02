import { createPlan, PlanRequest, PlanResponse } from "../../orchestrator/plan";
import * as planModule from "../../orchestrator/plan";

describe("createPlan", () => {
  const baseInput: PlanRequest = {
    sessionId: "session-1",
    userGoal: "Build a chatbot",
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns success and plan for valid input", async () => {
    jest.spyOn(planModule as any, "generatePlan").mockReturnValue({
      planId: "plan-123",
      createdAt: "2025-01-01T00:00:00Z",
      steps: [
        { id: "step-1", description: "Analyze goal", status: "pending" },
      ],
      summary: "Plan for: Build a chatbot",
    });

    const result = await createPlan(baseInput);

    expect(result.success).toBe(true);
    expect(result.plan).toBeDefined();
    expect(result.plan?.planId).toBe("plan-123");
    expect(result.plan?.steps.length).toBe(1);
    expect(result.plan?.summary).toBe("Plan for: Build a chatbot");
  });

  it("returns error for invalid input (missing userGoal)", async () => {
    const badInput = { ...baseInput, userGoal: "" };
    const result = await createPlan(badInput as any);
    expect(result.success).toBe(false);
    expect(result.plan).toBeUndefined();
    expect(result.error).toMatch(/Invalid input/);
  });

  it("handles optional context field", async () => {
    jest.spyOn(planModule as any, "generatePlan").mockReturnValue({
      planId: "plan-ctx",
      createdAt: "2025-01-01T00:00:00Z",
      steps: [],
      summary: "Plan for: Build a chatbot",
    });

    const input: PlanRequest = {
      ...baseInput,
      context: { foo: "bar" },
    };
    const result = await createPlan(input);
    expect(result.success).toBe(true);
    expect(result.plan?.planId).toBe("plan-ctx");
  });

  it("propagates errors from generatePlan as testable edge case", async () => {
    jest.spyOn(planModule as any, "generatePlan").mockImplementation(() => {
      throw new Error("Planning error");
    });
    // The function does not catch errors from generatePlan, so this will throw
    await expect(createPlan(baseInput)).rejects.toThrow("Planning error");
  });
});