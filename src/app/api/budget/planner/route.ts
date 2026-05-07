import { authenticateUser } from "@/lib/api/authMiddleware";
import { BudgetService } from "@/services/budget/BudgetService";
import type { CalculatorSnapshot } from "@/services/budget/contracts";

export async function GET() {
  try {
    const { userId, supabase } = await authenticateUser();
    const service = new BudgetService(supabase);
    const data = await service.getPlannerSnapshot(userId);
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load planner";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await authenticateUser();
    const payload = (await request.json()) as Partial<CalculatorSnapshot>;

    if (!payload || typeof payload !== "object") {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (
      payload.payCycle !== "weekly" && payload.payCycle !== "fortnightly" && payload.payCycle !== "monthly"
    ) {
      return Response.json({ error: "Invalid calculator payload" }, { status: 400 });
    }
    if (typeof payload.income !== "number") {
      return Response.json({ error: "Invalid calculator payload" }, { status: 400 });
    }

    const service = new BudgetService(supabase);
    await service.saveCalculator(userId, {
      payCycle: payload.payCycle,
      income: payload.income,
      fixedExpenses: 0,
      variableExpenses: 0,
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save calculator";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}