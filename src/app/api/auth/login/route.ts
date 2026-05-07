import { createServiceRoleSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthIdentityService } from "@/services/auth/AuthIdentityService";

interface LoginRequest {
  identifier: string;
  password: string;
}

function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LoginRequest>;
    if (typeof body.identifier !== "string" || typeof body.password !== "string") {
      return jsonError("Username and password are required", 400);
    }

    const identityService = new AuthIdentityService(createServiceRoleSupabaseClient());
    const email = await identityService.resolveEmailForLogin(body.identifier);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: body.password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return jsonError("Email not confirmed. Please confirm your email first, then log in.", 401);
      }

      return jsonError("Invalid email, username, or password", 401);
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";

    if (message === "Enter your username") {
      return jsonError(message, 400);
    }

    if (message === "Invalid email, username, or password") {
      return jsonError(message, 401);
    }

    return jsonError(message, 500);
  }
}