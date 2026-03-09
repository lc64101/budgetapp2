import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseAccountRepository } from "./supabaseAccountRepository";
import { SupabaseSocialRepository } from "./supabaseSocialRepository";

export function createSupabaseRepositories(supabase: SupabaseClient) {
  return {
    account: new SupabaseAccountRepository(supabase),
    social: new SupabaseSocialRepository(supabase),
  };
}
