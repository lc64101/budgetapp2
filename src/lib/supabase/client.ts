import { createClient } from "@supabase/supabase-js";
import { getClientSupabaseEnv } from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getClientSupabaseEnv();
  return createClient(url, anonKey);
}
