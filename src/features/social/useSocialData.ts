"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSocialQueryTiming } from "@/features/shared/sync/useSocialQueryOptions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseRepositories } from "@/data/repositories/supabase";
import type { FriendRequest, LeaderboardRow } from "@/data/repositories/socialRepository";

export function useSocialData(userId: string) {
  const repositories = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return createSupabaseRepositories(createBrowserSupabaseClient());
  }, []);
  const socialTiming = getSocialQueryTiming();

  const leaderboard = useQuery<LeaderboardRow[], Error>({
    queryKey: ["social", "leaderboard", userId] as const,
    queryFn: () => {
      if (!repositories) {
        throw new Error("Supabase client unavailable on server render");
      }

      return repositories.social.getLeaderboard(userId);
    },
    enabled: Boolean(userId && repositories),
    ...socialTiming,
  });

  const friendRequests = useQuery<FriendRequest[], Error>({
    queryKey: ["social", "friend-requests", userId] as const,
    queryFn: () => {
      if (!repositories) {
        throw new Error("Supabase client unavailable on server render");
      }

      return repositories.social.getPendingFriendRequests(userId);
    },
    enabled: Boolean(userId && repositories),
    ...socialTiming,
  });

  return { leaderboard, friendRequests };
}
