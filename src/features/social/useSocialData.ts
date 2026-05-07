"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSocialQueryTiming } from "@/features/shared/sync/useSocialQueryOptions";
import { ApiClient } from "@/lib/api/apiClient";
import type { FriendRequest, LeaderboardEntry } from "@/services/social/contracts";

export function useSocialData(userId: string) {
  const queryClient = useQueryClient();
  const apiClient = useMemo(() => new ApiClient(), []);
  const socialTiming = getSocialQueryTiming();

  const leaderboard = useQuery<LeaderboardEntry[], Error>({
    queryKey: ["social", "leaderboard", userId] as const,
    queryFn: () => apiClient.get<LeaderboardEntry[]>("/api/social/leaderboard"),
    enabled: Boolean(userId),
    ...socialTiming,
  });

  const friendRequests = useQuery<FriendRequest[], Error>({
    queryKey: ["social", "friend-requests", userId] as const,
    queryFn: () => apiClient.get<FriendRequest[]>("/api/social/friend-requests"),
    enabled: Boolean(userId),
    ...socialTiming,
  });

  const sendFriendRequest = useMutation({
    mutationFn: async (targetUsername: string) =>
      apiClient.post<void>("/api/social/friend-requests", {
        username: targetUsername,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "leaderboard", userId] });
      queryClient.invalidateQueries({ queryKey: ["social", "friend-requests", userId] });
    },
  });

  const acceptFriendRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await apiClient.post<void>(`/api/social/friend-requests/${requestId}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "leaderboard", userId] });
      queryClient.invalidateQueries({ queryKey: ["social", "friend-requests", userId] });
    },
  });

  return {
    leaderboard,
    friendRequests,
    sendFriendRequest: sendFriendRequest.mutateAsync,
    acceptFriendRequest: acceptFriendRequest.mutateAsync,
    isSendingRequest: sendFriendRequest.isPending,
    isAcceptingRequest: acceptFriendRequest.isPending,
  };
}
