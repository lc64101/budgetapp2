"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createSupabaseRepositories } from "@/data/repositories/supabase";
import type { AccountSettingsSnapshot } from "@/data/repositories/accountRepository";

const ACCOUNT_QUERY_KEY = ["account-settings"] as const;

export function useAccountSettings(userId: string) {
  const queryClient = useQueryClient();
  const repositories = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return createSupabaseRepositories(createBrowserSupabaseClient());
  }, []);

  const query = useQuery<AccountSettingsSnapshot, Error>({
    queryKey: [...ACCOUNT_QUERY_KEY, userId],
    queryFn: () => {
      if (!repositories) {
        throw new Error("Supabase client unavailable on server render");
      }

      return repositories.account.getSettings(userId);
    },
    enabled: Boolean(userId && repositories),
  });

  const mutation = useMutation({
    mutationFn: async (next: { darkMode: boolean; payFrequency: "weekly" | "fortnightly" | "monthly" }) => {
      if (!query.data) {
        throw new Error("No current settings snapshot available");
      }
      if (!repositories) {
        throw new Error("Supabase client unavailable on server render");
      }

      return repositories.account.updateSettings(userId, next, query.data.version);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ACCOUNT_QUERY_KEY, userId] });
    },
  });

  return {
    ...query,
    updateSettings: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
