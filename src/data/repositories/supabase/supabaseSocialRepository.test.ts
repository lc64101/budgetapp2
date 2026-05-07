import { describe, expect, it, vi } from "vitest";
import { SupabaseSocialRepository } from "@/data/repositories/supabase/supabaseSocialRepository";

describe("SupabaseSocialRepository", () => {
  it("maps leaderboard rows with profile usernames", async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          user_id: "u1",
          spending_score: 88.5,
          profiles: { username: "alex" },
        },
        {
          user_id: "u2",
          spending_score: 72,
          profiles: [{ username: "jamie" }],
        },
      ],
      error: null,
    });
    const order = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ order }));
    const from = vi.fn((table: string) => {
      if (table === "historical_metrics") {
        return { select };
      }

      return { select: vi.fn() };
    });

    const repository = new SupabaseSocialRepository({ from } as never);
    const result = await repository.getLeaderboard("u1");

    expect(result).toEqual([
      { userId: "u1", username: "alex", score: 88.5 },
      { userId: "u2", username: "jamie", score: 72 },
    ]);
  });

  it("throws when leaderboard query fails", async () => {
    const limit = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const order = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));

    const repository = new SupabaseSocialRepository({ from } as never);

    await expect(repository.getLeaderboard("u1")).rejects.toThrow("Failed to load leaderboard for user u1: boom");
  });

  it("maps pending friend requests", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        { id: "r1", from_user_id: "u2", to_user_id: "u1", created_at: "2026-03-09T10:00:00Z" },
      ],
      error: null,
    });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn((table: string) => {
      if (table === "friend_requests") {
        return { select };
      }

      return { select: vi.fn() };
    });

    const repository = new SupabaseSocialRepository({ from } as never);
    const result = await repository.getPendingFriendRequests("u1");

    expect(result).toEqual([
      { id: "r1", fromUserId: "u2", toUserId: "u1", createdAt: "2026-03-09T10:00:00Z" },
    ]);
  });

  it("throws when friend requests query fails", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: "denied" } });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const repository = new SupabaseSocialRepository({ from } as never);

    await expect(repository.getPendingFriendRequests("u1")).rejects.toThrow(
      "Failed to load pending friend requests: denied",
    );
  });
});
