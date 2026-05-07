import { createServiceRoleSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthIdentityService } from "@/services/auth/AuthIdentityService";

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RegisterRequest>;
    if (typeof body.email !== "string" || typeof body.username !== "string" || typeof body.password !== "string") {
      return jsonError("Email, username, and password are required", 400);
    }

    const normalizedEmail = body.email.trim().toLowerCase();
    if (!normalizedEmail) {
      return jsonError("Email is required", 400);
    }

    const identityService = new AuthIdentityService(createServiceRoleSupabaseClient());
    const normalizedUsername = await identityService.assertUsernameAvailable(body.username);
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: body.password,
      options: {
        data: {
          username: normalizedUsername,
        },
      },
    });

    if (error) {
      const lower = error.message.toLowerCase();

      if (lower.includes("username") || lower.includes("profiles_username_key")) {
        return jsonError("Username is already taken", 409);
      }

      return jsonError(error.message, 400);
    }

    return Response.json({
      requiresEmailConfirmation: !data.session,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";

    if (message === "Username is already taken") {
      return jsonError(message, 409);
    }

    if (
      message === "Username is required" ||
      message.includes("Username must be 3-24 characters")
    ) {
      return jsonError(message, 400);
    }

    return jsonError(message, 500);
  }
}