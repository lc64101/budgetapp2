import { authenticateUser } from "@/lib/api/authMiddleware";
import { SocialService } from "@/services/social/SocialService";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { supabase } = await authenticateUser();
    const { id } = await context.params;

    if (!id) {
      return Response.json({ error: "Friend request id is required" }, { status: 400 });
    }

    const service = new SocialService(supabase);
    await service.acceptFriendRequest(id);

    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept friend request";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}