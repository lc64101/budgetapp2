import { authenticateUser } from "@/lib/api/authMiddleware";
import { BudgetService } from "@/services/budget/BudgetService";
import type { AddExpensePayload, ExpenseFrequency } from "@/services/budget/contracts";

const VALID_FREQUENCIES: ExpenseFrequency[] = ["weekly", "fortnightly", "monthly", "annual", "ongoing"];

export async function GET() {
  try {
    const { userId, supabase } = await authenticateUser();
    const service = new BudgetService(supabase);
    const data = await service.getExpenses(userId);
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load expenses";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await authenticateUser();
    const payload = (await request.json()) as Partial<AddExpensePayload>;

    if (
      typeof payload.description !== "string" ||
      payload.description.trim().length === 0 ||
      typeof payload.amount !== "number" ||
      !Number.isFinite(payload.amount) ||
      payload.amount < 0 ||
      !VALID_FREQUENCIES.includes(payload.frequency as ExpenseFrequency)
    ) {
      return Response.json({ error: "Invalid expense payload" }, { status: 400 });
    }

    const service = new BudgetService(supabase);
    const item = await service.addExpense(userId, {
      description: payload.description.trim(),
      vendor: typeof payload.vendor === "string" ? payload.vendor : null,
      frequency: payload.frequency as ExpenseFrequency,
      amount: payload.amount,
      catalogPlanId: typeof payload.catalogPlanId === "string" ? payload.catalogPlanId : null,
      catalogPrice: typeof payload.catalogPrice === "number" ? payload.catalogPrice : null,
      userPrice: typeof payload.userPrice === "number" ? payload.userPrice : null,
    });
    return Response.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add expense";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
