import { authenticateUser } from "@/lib/api/authMiddleware";
import { BudgetService } from "@/services/budget/BudgetService";
import type { ExpenseFrequency, UpdateExpensePayload } from "@/services/budget/contracts";

const VALID_FREQUENCIES: ExpenseFrequency[] = ["weekly", "fortnightly", "monthly", "annual", "ongoing"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase } = await authenticateUser();
    const { id } = await params;
    const body = (await request.json()) as Partial<UpdateExpensePayload>;

    const patch: UpdateExpensePayload = {};
    if (typeof body.description === "string") patch.description = body.description.trim();
    if (typeof body.vendor === "string" || body.vendor === null) patch.vendor = body.vendor;
    if (VALID_FREQUENCIES.includes(body.frequency as ExpenseFrequency)) patch.frequency = body.frequency as ExpenseFrequency;
    if (typeof body.amount === "number" && Number.isFinite(body.amount) && body.amount >= 0) patch.amount = body.amount;
    if ("userPrice" in body) {
      patch.userPrice = typeof body.userPrice === "number" && Number.isFinite(body.userPrice) ? body.userPrice : null;
    }

    const service = new BudgetService(supabase);
    await service.updateExpense(userId, id, patch);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update expense";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase } = await authenticateUser();
    const { id } = await params;
    const service = new BudgetService(supabase);
    await service.deleteExpense(userId, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete expense";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
