import type { SupabaseClient } from "@supabase/supabase-js";
import type { FriendRequest, LeaderboardRow, SocialRepository } from "@/data/repositories/socialRepository";

interface FriendRequestRowDb {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

export class SupabaseSocialRepository implements SocialRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getLeaderboard(userId: string): Promise<LeaderboardRow[]> {
    const { data, error } = await this.supabase
      .from("historical_metrics")
      .select("user_id,profiles!inner(username),spending_score")
      .order("recorded_on", { ascending: false })
      .limit(25);

    if (error) {
      throw new Error(`Failed to load leaderboard for user ${userId}: ${error.message}`);
    }

    const rows = (data ?? []) as Array<{
      user_id: string;
      spending_score: number;
      profiles: { username: string } | { username: string }[];
    }>;

    return rows.map((row) => ({
      userId: row.user_id,
      username: Array.isArray(row.profiles) ? row.profiles[0]?.username ?? "unknown" : row.profiles.username,
      score: row.spending_score,
    }));
  }

  async getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
    const { data, error } = await this.supabase
      .from("friend_requests")
      .select("id,from_user_id,to_user_id,created_at")
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load pending friend requests: ${error.message}`);
    }

    return ((data ?? []) as FriendRequestRowDb[]).map((row) => ({
      id: row.id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      createdAt: row.created_at,
    }));
  }
}
