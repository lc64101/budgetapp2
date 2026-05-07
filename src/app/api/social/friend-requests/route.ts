import { authenticateUser } from "@/lib/api/authMiddleware";
import { SocialService } from "@/services/social/SocialService";
import type { SendFriendRequestPayload } from "@/services/social/contracts";

export async function GET() {
  try {
    const { userId, supabase } = await authenticateUser();
    const service = new SocialService(supabase);
    const data = await service.getFriendRequests(userId);
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load friend requests";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, supabase } = await authenticateUser();
    const payload = (await request.json()) as Partial<SendFriendRequestPayload>;

    if (!payload.username || typeof payload.username !== "string") {
      return Response.json({ error: "Username is required" }, { status: 400 });
    }

    const service = new SocialService(supabase);
    await service.sendFriendRequest(userId, payload.username);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send friend request";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}