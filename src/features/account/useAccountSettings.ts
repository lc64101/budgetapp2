"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccountSettingsSnapshot, DashboardLayout } from "@/data/repositories/accountRepository";
import { ApiClient } from "@/lib/api/apiClient";
import type { AccountMutationResponse, GetAccountSettingsResponse } from "@/services/account/contracts";

const ACCOUNT_QUERY_KEY = ["account-settings"] as const;

export function useAccountSettings(userId: string) {
  const queryClient = useQueryClient();
  const apiClient = useMemo(() => new ApiClient(), []);

  const query = useQuery<AccountSettingsSnapshot, Error>({
    queryKey: [...ACCOUNT_QUERY_KEY, userId],
    queryFn: () => apiClient.get<GetAccountSettingsResponse>("/api/account/settings"),
    enabled: Boolean(userId),
  });

  const mutation = useMutation({
    mutationFn: async (next: { darkMode: boolean; payFrequency: "weekly" | "fortnightly" | "monthly" }) => {
      if (!query.data) {
        throw new Error("No current settings snapshot available");
      }

      return apiClient.patch<AccountMutationResponse>("/api/account/settings", {
        ...next,
        expectedVersion: query.data.version,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ACCOUNT_QUERY_KEY, userId] });
    },
  });

  const dashboardLayoutMutation = useMutation({
    mutationFn: async (layout: DashboardLayout) => {
      if (!query.data) {
        throw new Error("No current settings snapshot available");
      }

      try {
        const result = await apiClient.patch<AccountMutationResponse>("/api/account/settings", {
          dashboardLayout: layout,
          expectedVersion: query.data.version,
        });
        return { meta: result.meta, layout };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown dashboard layout persistence error";

        if (!message.toLowerCase().includes("version conflict")) {
          throw error;
        }

        const fresh = await apiClient.get<GetAccountSettingsResponse>("/api/account/settings");
        queryClient.setQueryData([...ACCOUNT_QUERY_KEY, userId], fresh);
        const result = await apiClient.patch<AccountMutationResponse>("/api/account/settings", {
          dashboardLayout: layout,
          expectedVersion: fresh.version,
        });
        return { meta: result.meta, layout };
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData<AccountSettingsSnapshot | undefined>([...ACCOUNT_QUERY_KEY, userId], (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          dashboardLayout: result.layout,
          version: result.meta.version,
          updatedAt: result.meta.updatedAt,
        };
      });

      queryClient.invalidateQueries({ queryKey: [...ACCOUNT_QUERY_KEY, userId] });
    },
  });

  return {
    ...query,
    updateSettings: mutation.mutateAsync,
    updateDashboardLayout: dashboardLayoutMutation.mutateAsync,
    isSaving: mutation.isPending,
    isSavingDashboardLayout: dashboardLayoutMutation.isPending,
  };
}
