"use client";

import { useSocialData } from "@/features/social/useSocialData";

export function SocialPanel({ userId }: { userId: string }) {
  const { leaderboard, friendRequests } = useSocialData(userId);

  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Social (60s Refresh)</h2>

      <h3>Leaderboard</h3>
      {leaderboard.isLoading ? <p>Loading leaderboard...</p> : null}
      {leaderboard.error ? <p>Failed to load leaderboard: {leaderboard.error.message}</p> : null}
      <ul>
        {(leaderboard.data ?? []).slice(0, 5).map((entry) => (
          <li key={`${entry.userId}-${entry.score}`}>
            {entry.username}: {entry.score.toFixed(2)}
          </li>
        ))}
      </ul>

      <h3>Pending Friend Requests</h3>
      {friendRequests.isLoading ? <p>Loading friend requests...</p> : null}
      {friendRequests.error ? <p>Failed to load friend requests: {friendRequests.error.message}</p> : null}
      <ul>
        {(friendRequests.data ?? []).map((request) => (
          <li key={request.id}>From: {request.fromUserId}</li>
        ))}
      </ul>
    </section>
  );
}
