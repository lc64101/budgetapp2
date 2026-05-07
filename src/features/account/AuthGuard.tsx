"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const init = useMemo(() => {
    try {
      return { client: createBrowserSupabaseClient(), error: null as string | null };
    } catch (error) {
      return {
        client: null,
        error: error instanceof Error ? error.message : "Supabase configuration missing",
      };
    }
  }, []);

  const [bootstrapped, setBootstrapped] = useState(() => !init.client);

  useEffect(() => {
    let mounted = true;

    if (!init.client) {
      return;
    }

    const supabase = init.client;

    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) {
          return;
        }

        const ok = Boolean(data.session);
        setAuthenticated(ok);
        setReady(true);
        setBootstrapped(true);

        if (!ok) {
          router.replace("/login");
        }
      } catch {
        if (!mounted) {
          return;
        }

        setAuthenticated(false);
        setReady(true);
        setBootstrapped(true);
        router.replace("/login");
      }
    };

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const ok = Boolean(session);
      setAuthenticated(ok);
      setReady(true);
      setBootstrapped(true);
      if (!ok) {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [init, router]);

  if (init.error) {
    return <div className="app-loading">{init.error}</div>;
  }

  if ((!bootstrapped || !ready) && init.client) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!authenticated) {
    return <div className="app-loading">Loading...</div>;
  }

  return <>{children}</>;
}
