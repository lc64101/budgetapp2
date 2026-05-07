import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthenticatedRequestContext {
  userId: string;
  supabase: SupabaseClient;
}

export async function authenticateUser(): Promise<AuthenticatedRequestContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    throw new Error("Unauthorized");
  }

  return { userId: user.id, supabase };
}
