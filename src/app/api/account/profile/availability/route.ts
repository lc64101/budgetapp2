import { authenticateUser } from "@/lib/api/authMiddleware";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { AuthIdentityService, normalizeUsername } from "@/services/auth/AuthIdentityService";
import type { UsernameAvailabilityResponse } from "@/services/account/contracts";

function jsonError(message: string, status = 500): Response {
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const { userId } = await authenticateUser();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") ?? "";
    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
      return Response.json({
        available: false,
        normalizedUsername,
        reason: "Username is required",
      } satisfies UsernameAvailabilityResponse);
    }

    const identityService = new AuthIdentityService(createServiceRoleSupabaseClient());

    try {
      await identityService.assertUsernameAvailable(normalizedUsername, userId);
      return Response.json({
        available: true,
        normalizedUsername,
      } satisfies UsernameAvailabilityResponse);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Username is unavailable";

      if (
        reason === "Username is already taken" ||
        reason === "Username is required" ||
        reason.includes("Username must be 3-24 characters")
      ) {
        return Response.json({
          available: false,
          normalizedUsername,
          reason,
        } satisfies UsernameAvailabilityResponse);
      }

      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check username availability";
    return jsonError(message, message === "Unauthorized" ? 401 : 500);
  }
}