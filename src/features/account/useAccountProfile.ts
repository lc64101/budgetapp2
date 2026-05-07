"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api/apiClient";
import type { AccountProfileResponse, UsernameAvailabilityResponse } from "@/services/account/contracts";

const ACCOUNT_PROFILE_QUERY_KEY = ["account-profile"] as const;
const USERNAME_AVAILABILITY_QUERY_KEY = ["username-availability"] as const;

export function useAccountProfile(userId: string) {
  const queryClient = useQueryClient();
  const apiClient = useMemo(() => new ApiClient(), []);

  const query = useQuery<AccountProfileResponse, Error>({
    queryKey: [...ACCOUNT_PROFILE_QUERY_KEY, userId],
    queryFn: () => apiClient.get<AccountProfileResponse>("/api/account/profile"),
    enabled: Boolean(userId),
  });

  const mutation = useMutation({
    mutationFn: async (username: string) => apiClient.patch<AccountProfileResponse>("/api/account/profile", { username }),
    onSuccess: (profile) => {
      queryClient.setQueryData<AccountProfileResponse>([...ACCOUNT_PROFILE_QUERY_KEY, userId], profile);
      queryClient.invalidateQueries({ queryKey: [...ACCOUNT_PROFILE_QUERY_KEY, userId] });
    },
  });

  return {
    ...query,
    updateUsername: mutation.mutateAsync,
    isSavingUsername: mutation.isPending,
  };
}

export function useUsernameAvailability(userId: string, username: string, enabled: boolean) {
  const apiClient = useMemo(() => new ApiClient(), []);

  return useQuery<UsernameAvailabilityResponse, Error>({
    queryKey: [...USERNAME_AVAILABILITY_QUERY_KEY, userId, username],
    queryFn: () =>
      apiClient.get<UsernameAvailabilityResponse>(
        `/api/account/profile/availability?username=${encodeURIComponent(username)}`,
      ),
    enabled: Boolean(userId && enabled),
    staleTime: 15_000,
  });
}