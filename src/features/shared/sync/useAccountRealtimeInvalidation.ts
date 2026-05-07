"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface AccountRealtimeInvalidationProps {
  userId: string;
  queryKeyPrefix: readonly unknown[];
}

export function useAccountRealtimeInvalidation({
  userId,
  queryKeyPrefix,
}: AccountRealtimeInvalidationProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`account:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeyPrefix });
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient, queryKeyPrefix, userId]);
}
