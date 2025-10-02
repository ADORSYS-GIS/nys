import { z } from "zod";

// Plan step schema
export const PlanStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  tool: z.string().optional(),
  params: z.record(z.any()).optional(),
});

// Plan schema
export const PlanSchema = z.object({
  planId: z.string(),
  createdAt: z.string(),
  steps: z.array(PlanStepSchema),
  summary: z.string().optional(),
});

// Types
export type PlanStep = z.infer<typeof PlanStepSchema>;
export type Plan = z.infer<typeof PlanSchema>;

// Input schema for /orchestrator/plan
export const PlanRequestSchema = z.object({
  sessionId: z.string().min(1),
  userGoal: z.string().min(1),
  context: z.record(z.any()).optional(),
});

// Output schema for /orchestrator/plan
export const PlanResponseSchema = z.object({
  success: z.boolean(),
  plan: PlanSchema.optional(),
  error: z.string().optional(),
});

export type PlanRequest = z.infer<typeof PlanRequestSchema>;
export type PlanResponse = z.infer<typeof PlanResponseSchema>;

// Stub: Generate a plan
function generatePlan(userGoal: string, _context?: any): Plan {
  // Placeholder: returns a static plan
  return {
    planId: "plan-stub-id",
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: "step-1",
        description: `Analyze goal: ${userGoal}`,
        status: "pending",
      },
      {
        id: "step-2",
        description: "Select tools and parameters",
        status: "pending",
      },
      {
        id: "step-3",
        description: "Execute plan steps",
        status: "pending",
      },
    ],
    summary: `Plan for: ${userGoal}`,
  };
}

// Main orchestrator endpoint logic
export async function createPlan(input: PlanRequest): Promise<PlanResponse> {
  const parseResult = PlanRequestSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: "Invalid input: " + JSON.stringify(parseResult.error.format()),
    };
  }

  // Generate plan (stub)
  const plan = generatePlan(input.userGoal, input.context);

  return {
    success: true,
    plan,
  };
}

// Service stub for integration (example Express handler signature)
export const planHandler = async (req: any, res: any) => {
  const result = await createPlan(req.body);
  res.json(result);
};