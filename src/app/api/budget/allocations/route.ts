import { authenticateUser } from "@/lib/api/authMiddleware";
import { BudgetService } from "@/services/budget/BudgetService";
import type { SaveAllocationsRequest } from "@/services/budget/contracts";

export async function PUT(request: Request) {
  try {
    const { userId, supabase } = await authenticateUser();
    const payload = (await request.json()) as Partial<SaveAllocationsRequest>;

    if (!payload.allocations || !payload.activeMode || !payload.modeDrafts) {
      return Response.json({ error: "Invalid allocation payload" }, { status: 400 });
    }

    const service = new BudgetService(supabase);
    await service.saveAllocations(userId, payload as SaveAllocationsRequest);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save allocations";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}