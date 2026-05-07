"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface CurrentUserState {
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface SupabaseInitResult {
  client: ReturnType<typeof createBrowserSupabaseClient> | null;
  error: string | null;
}

let cachedUserId: string | null | undefined;
let cachedUserError: string | null | undefined;

export function useCurrentUser(): CurrentUserState {
  const initResult = useMemo<SupabaseInitResult>(() => {
    if (typeof window === "undefined") {
      return { client: null, error: null };
    }

    try {
      return { client: createBrowserSupabaseClient(), error: null };
    } catch (error) {
      return {
        client: null,
        error: error instanceof Error ? error.message : "Supabase client unavailable",
      };
    }
  }, []);

  // Keep first render deterministic for SSR/CSR hydration.
  const [state, setState] = useState<CurrentUserState>({
    userId: cachedUserId ?? null,
    isLoading: cachedUserId === undefined && cachedUserError === undefined,
    error: cachedUserError ?? null,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;

    if (initResult.error) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setState({ userId: null, isLoading: false, error: initResult.error });
        }
      });

      return () => {
        isMounted = false;
      };
    }

    const supabase = initResult.client;

    if (!supabase) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setState({ userId: null, isLoading: false, error: "Supabase client unavailable" });
        }
      });

      return () => {
        isMounted = false;
      };
    }

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        setState({
          userId: data.session?.user?.id ?? null,
          isLoading: false,
          error: error?.message ?? null,
        });

        cachedUserId = data.session?.user?.id ?? null;
        cachedUserError = error?.message ?? null;
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to verify authentication status";
        setState({
          userId: null,
          isLoading: false,
          error: message,
        });
        cachedUserId = null;
        cachedUserError = message;
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      cachedUserId = session?.user?.id ?? null;
      cachedUserError = null;
      setState((prev) => ({ ...prev, userId: session?.user?.id ?? null, isLoading: false, error: null }));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initResult]);

  return state;
}
