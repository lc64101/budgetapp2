import { createClient } from "@supabase/supabase-js";
import { getClientSupabaseEnv, getServerSupabaseEnv } from "@/lib/supabase/env";

export function createServerSupabaseClient() {
  const { url, anonKey } = getClientSupabaseEnv();
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export function createServiceRoleSupabaseClient() {
  const { url, serviceRoleKey } = getServerSupabaseEnv();
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
