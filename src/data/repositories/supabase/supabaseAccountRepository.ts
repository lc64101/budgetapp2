import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountMutationMeta } from "@/contracts/sync";
import type { AccountRepository, AccountSettings, AccountSettingsSnapshot } from "@/data/repositories/accountRepository";

interface AppSettingsRow {
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
  updated_at: string;
  version: number;
  last_modified_by_session: string;
}

export class SupabaseAccountRepository implements AccountRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getSettings(userId: string): Promise<AccountSettingsSnapshot> {
    const { data, error } = await this.supabase
      .from("app_settings")
      .select("user_id,dark_mode,pay_frequency,updated_at,version,last_modified_by_session")
      .eq("user_id", userId)
      .single<AppSettingsRow>();

    if (error) {
      throw new Error(`Failed to load account settings: ${error.message}`);
    }

    return {
      darkMode: data.dark_mode,
      payFrequency: data.pay_frequency,
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
}
