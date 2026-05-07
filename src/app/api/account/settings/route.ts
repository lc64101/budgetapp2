import { createSupabaseRepositories } from "@/data/repositories/supabase";
import { authenticateUser } from "@/lib/api/authMiddleware";
import { AccountService } from "@/services/account/AccountService";
import type {
  AccountMutationResponse,
  GetAccountSettingsResponse,
  UpdateAccountSettingsRequest,
  UpdateDashboardLayoutRequest,
} from "@/services/account/contracts";

function jsonError(message: string, status = 500): Response {
  return Response.json({ error: message }, { status });
}

function isDashboardLayoutRequest(value: unknown): value is UpdateDashboardLayoutRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<UpdateDashboardLayoutRequest>;
  return !!candidate.dashboardLayout && typeof candidate.expectedVersion === "number";
}

function isSettingsRequest(value: unknown): value is UpdateAccountSettingsRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<UpdateAccountSettingsRequest>;
  const payFrequency = candidate.payFrequency;
  return (
    typeof candidate.darkMode === "boolean" &&
    (payFrequency === "weekly" || payFrequency === "fortnightly" || payFrequency === "monthly") &&
    typeof candidate.expectedVersion === "number"
  );
}

export async function GET() {
  try {
    const { userId, supabase } = await authenticateUser();
    const repositories = createSupabaseRepositories(supabase);
    const service = new AccountService(repositories.account);
    const settings: GetAccountSettingsResponse = await service.getSettings(userId);
    return Response.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load account settings";
    return jsonError(message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, supabase } = await authenticateUser();
    const repositories = createSupabaseRepositories(supabase);
    const service = new AccountService(repositories.account);
    const body: unknown = await request.json();

    let meta: AccountMutationResponse["meta"];

    if (isDashboardLayoutRequest(body)) {
      meta = await service.updateDashboardLayout(userId, body.dashboardLayout, body.expectedVersion);
    } else if (isSettingsRequest(body)) {
      meta = await service.updateSettings(
        userId,
        {
          darkMode: body.darkMode,
          payFrequency: body.payFrequency,
        },
        body.expectedVersion,
      );
    } else {
      return jsonError("Invalid request payload", 400);
    }

    return Response.json({ meta } satisfies AccountMutationResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update account settings";
    const lower = message.toLowerCase();

    if (message === "Unauthorized") {
      return jsonError(message, 401);
    }

    if (lower.includes("version conflict")) {
      return jsonError(message, 409);
    }

    return jsonError(message, 500);
  }
}
