import { authenticateUser } from "@/lib/api/authMiddleware";
import { SocialService } from "@/services/social/SocialService";

export async function GET() {
  try {
    const { userId, supabase } = await authenticateUser();
    const service = new SocialService(supabase);
    const data = await service.getLeaderboard(userId);
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leaderboard";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}