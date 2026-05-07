import { authenticateUser } from "@/lib/api/authMiddleware";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AuthIdentityService } from "@/services/auth/AuthIdentityService";
import type { AccountProfileResponse, UpdateUsernameRequest } from "@/services/account/contracts";

function jsonError(message: string, status = 500): Response {
  return Response.json({ error: message }, { status });
}

export async function GET() {
  try {
    const { userId, supabase } = await authenticateUser();
    const { data, error } = await supabase.from("profiles").select("username").eq("id", userId).single<{ username: string }>();

    if (error) {
      throw new Error(`Failed to load account profile: ${error.message}`);
    }

    return Response.json({ username: data.username } satisfies AccountProfileResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load account profile";
    return jsonError(message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, supabase } = await authenticateUser();
    const body = (await request.json()) as Partial<UpdateUsernameRequest>;

    if (typeof body.username !== "string") {
      return jsonError("Username is required", 400);
    }

    const identityService = new AuthIdentityService(createServiceRoleSupabaseClient());
    const normalizedUsername = await identityService.assertUsernameAvailable(body.username, userId);
    const { error } = await supabase.from("profiles").update({ username: normalizedUsername }).eq("id", userId);

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("profiles_username_key") || lower.includes("duplicate")) {
        return jsonError("Username is already taken", 409);
      }

      throw new Error(`Failed to update account profile: ${error.message}`);
    }

    return Response.json({ username: normalizedUsername } satisfies AccountProfileResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update account profile";

    if (message === "Unauthorized") {
      return jsonError(message, 401);
    }

    if (message === "Username is already taken") {
      return jsonError(message, 409);
    }

    if (message === "Username is required" || message.includes("Username must be 3-24 characters")) {
      return jsonError(message, 400);
    }

    return jsonError(message, 500);
  }
}