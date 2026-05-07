import { authenticateUser } from "@/lib/api/authMiddleware";
import { BudgetService } from "@/services/budget/BudgetService";
import type { AddPayEntryPayload } from "@/services/budget/contracts";

export async function GET() {
  try {
    const { userId, supabase } = await authenticateUser();
    const service = new BudgetService(supabase);
    const data = await service.getPayEntries(userId);
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pay entries";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await authenticateUser();
    const payload = (await request.json()) as Partial<AddPayEntryPayload>;

    if (
      (payload.payCycle !== "weekly" && payload.payCycle !== "fortnightly" && payload.payCycle !== "monthly") ||
      typeof payload.paymentDate !== "string" ||
      typeof payload.amount !== "number"
    ) {
      return Response.json({ error: "Invalid pay entry payload" }, { status: 400 });
    }

    const service = new BudgetService(supabase);
    await service.addPayEntry(userId, payload as AddPayEntryPayload);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save pay entry";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}