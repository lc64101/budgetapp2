import { createBrowserClient } from "@supabase/ssr";
import { getClientSupabaseEnv } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getClientSupabaseEnv();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
