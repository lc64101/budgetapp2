import type { SupabaseClient } from "@supabase/supabase-js";
import type { FriendRequest, LeaderboardEntry } from "@/services/social/contracts";

function scoreTrend(entryScore: number, myScore: number): "better" | "worse" | "same" {
  if (entryScore > myScore) {
    return "better";
  }
  if (entryScore < myScore) {
    return "worse";
  }
  return "same";
}

export class SocialService {
  constructor(private readonly supabase: SupabaseClient) {}

  async getLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
    const { data: friendRows, error: friendsError } = await this.supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", userId);

    if (friendsError) {
      throw new Error(`Failed to load friends list: ${friendsError.message}`);
    }

    const candidateIds = new Set<string>([userId]);
    for (const row of friendRows ?? []) {
      candidateIds.add((row as { friend_id: string }).friend_id);
    }

    const { data: metricsRows, error: metricsError } = await this.supabase
      .from("historical_metrics")
      .select("user_id,spending_score,recorded_on")
      .order("recorded_on", { ascending: false })
      .limit(400);

    if (metricsError) {
      throw new Error(`Failed to load social metrics: ${metricsError.message}`);
    }

    const latestByUser = new Map<string, number>();
    for (const row of metricsRows ?? []) {
      const user = (row as { user_id: string }).user_id;
      if (!candidateIds.has(user) || latestByUser.has(user)) {
        continue;
      }
      latestByUser.set(user, Number((row as { spending_score: number }).spending_score) || 0);
    }

    if (!latestByUser.has(userId)) {
      latestByUser.set(userId, 0);
    }

    const { data: profileRows, error: profileError } = await this.supabase
      .from("profiles")
      .select("id,username")
      .in("id", [...latestByUser.keys()]);

    if (profileError) {
      throw new Error(`Failed to load profile names: ${profileError.message}`);
    }

    const usernameById = new Map<string, string>();
    for (const row of profileRows ?? []) {
      usernameById.set((row as { id: string }).id, (row as { username: string }).username);
    }

    const myScore = latestByUser.get(userId) ?? 0;

    return [...latestByUser.entries()]
      .map(([id, score]) => ({
        userId: id,
        username: usernameById.get(id) ?? `user-${id.slice(0, 6)}`,
        score,
        trend: scoreTrend(score, myScore),
      }))
      .sort((a, b) => b.score - a.score);
  }

  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    const { data: requests, error } = await this.supabase
      .from("friend_requests")
      .select("id,from_user_id,to_user_id,created_at")
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load friend requests: ${error.message}`);
    }

    const senderIds = [...new Set((requests ?? []).map((row: { from_user_id: string }) => row.from_user_id))];
    const { data: senders } = senderIds.length
      ? await this.supabase.from("profiles").select("id,username").in("id", senderIds)
      : { data: [] as Array<{ id: string; username: string }> };

    const usernameBySenderId = new Map(
      (senders ?? []).map((sender: { id: string; username: string }) => [sender.id, sender.username]),
    );

    return (requests ?? []).map((row: { id: string; from_user_id: string; to_user_id: string; created_at: string }) => ({
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      createdAt: row.created_at,
      fromUsername: usernameBySenderId.get(row.from_user_id) ?? "unknown",
    }));
  }

  async sendFriendRequest(userId: string, targetUsername: string): Promise<void> {
    const normalized = targetUsername.trim().toLowerCase();
    if (!normalized) {
      throw new Error("Enter a username");
    }

    const { data: targetProfileRow, error: targetError } = await this.supabase
      .from("profiles")
      .select("id,username")
      .eq("username", normalized)
      .maybeSingle();

    const targetProfile = targetProfileRow as { id: string; username: string } | null;

    if (targetError) {
      throw new Error(`Failed to find user: ${targetError.message}`);
    }

    if (!targetProfile?.id) {
      throw new Error("No user found with that username");
    }

    if (targetProfile.id === userId) {
      throw new Error("You cannot send a friend request to yourself");
    }

    const { error } = await this.supabase.from("friend_requests").insert({
      from_user_id: userId,
      to_user_id: targetProfile.id,
    } as never);

    if (error) {
      throw new Error(`Failed to send request: ${error.message}`);
    }
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    const { error } = await this.supabase.rpc("rpc_accept_friend_request" as never, { p_request_id: requestId } as never);
    if (error) {
      throw new Error(`Failed to accept friend request: ${error.message}`);
    }
  }
}