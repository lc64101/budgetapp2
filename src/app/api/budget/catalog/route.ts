import { authenticateUser } from "@/lib/api/authMiddleware";
import { BudgetService } from "@/services/budget/BudgetService";

export async function GET(request: Request) {
  try {
    const { supabase } = await authenticateUser();
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const region = url.searchParams.get("region") ?? "AU";
    const top = url.searchParams.get("top") === "true";

    const service = new BudgetService(supabase);
    const data = await service.getCatalog({ q: q || undefined, region, top });
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load catalog";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
