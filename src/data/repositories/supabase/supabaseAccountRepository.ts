import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountMutationMeta } from "@/contracts/sync";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeDashboardLayout,
  type AccountRepository,
  type AccountSettings,
  type AccountSettingsSnapshot,
  type DashboardLayout,
} from "@/data/repositories/accountRepository";

interface AppSettingsRow {
  user_id: string;
  dark_mode: boolean;
  pay_frequency: "weekly" | "fortnightly" | "monthly";
  dashboard_layout: unknown;
  updated_at: string;
  version: number;
  last_modified_by_session: string;
}

interface LegacyAppSettingsRow {
  user_id: string;
  dark_mode: boolean;
  pay_frequency: "weekly" | "fortnightly" | "monthly";
  updated_at: string;
  version: number;
  last_modified_by_session: string;
}

interface UpdateSettingsResponse {
  user_id: string;
  dark_mode: boolean;
  pay_frequency: "weekly" | "fortnightly" | "monthly";
  dashboard_layout: unknown;
  updated_at: string;
  version: number;
  last_modified_by_session: string;
}

export class SupabaseAccountRepository implements AccountRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getSettings(userId: string): Promise<AccountSettingsSnapshot> {
    const { data, error } = await this.supabase
      .from("app_settings")
      .select("user_id,dark_mode,pay_frequency,dashboard_layout,updated_at,version,last_modified_by_session")
      .eq("user_id", userId)
      .single<AppSettingsRow>();

    if (error) {
      // Allow app to run against pre-migration schemas by falling back to defaults.
      if (error.message.includes("dashboard_layout")) {
        const { data: legacyData, error: legacyError } = await this.supabase
          .from("app_settings")
          .select("user_id,dark_mode,pay_frequency,updated_at,version,last_modified_by_session")
          .eq("user_id", userId)
          .single<LegacyAppSettingsRow>();

        if (legacyError) {
          throw new Error(`Failed to load account settings: ${legacyError.message}`);
        }

        return {
          darkMode: legacyData.dark_mode,
          payFrequency: legacyData.pay_frequency,
          dashboardLayout: DEFAULT_DASHBOARD_LAYOUT,
          version: legacyData.version,
          updatedAt: legacyData.updated_at,
        };
      }

      throw new Error(`Failed to load account settings: ${error.message}`);
    }

    return {
      darkMode: data.dark_mode,
      payFrequency: data.pay_frequency,
      dashboardLayout: normalizeDashboardLayout(data.dashboard_layout),
      version: data.version,
      updatedAt: data.updated_at,
    };
  }

  async updateSettings(
    _userId: string,
    settings: Partial<AccountSettings>,
    currentVersion: number,
  ): Promise<AccountMutationMeta> {
    if (settings.darkMode === undefined || settings.payFrequency === undefined) {
      throw new Error("Both darkMode and payFrequency are required for atomic settings updates");
    }

    const sessionId = globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;

    const { data, error } = await this.supabase.rpc("rpc_update_app_settings", {
      p_dark_mode: settings.darkMode,
      p_pay_frequency: settings.payFrequency,
      p_expected_version: currentVersion,
      p_session_id: sessionId,
    });

    if (error) {
      throw new Error(`Failed to update account settings: ${error.message}`);
    }

    const updated = data as UpdateSettingsResponse;

    return {
      version: updated.version,
      updatedAt: updated.updated_at,
      lastModifiedBySession: updated.last_modified_by_session,
    };
  }

  async updateDashboardLayout(
    _userId: string,
    layout: DashboardLayout,
    currentVersion: number,
  ): Promise<AccountMutationMeta> {
    const sessionId = globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;

    const { data, error } = await this.supabase.rpc("rpc_update_dashboard_layout", {
      p_dashboard_layout: layout,
      p_expected_version: currentVersion,
      p_session_id: sessionId,
    });

    if (error) {
      if (error.message.toLowerCase().includes("rpc_update_dashboard_layout")) {
        throw new Error("Dashboard layout persistence is unavailable until the latest Supabase migration is applied.");
      }

      throw new Error(`Failed to update dashboard layout: ${error.message}`);
    }

    const updated = data as UpdateSettingsResponse;

    return {
      version: updated.version,
      updatedAt: updated.updated_at,
      lastModifiedBySession: updated.last_modified_by_session,
    };
  }
}
