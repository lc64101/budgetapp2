import type { AccountMutationMeta } from "@/contracts/sync";

export interface AccountSettings {
  darkMode: boolean;
  payFrequency: "weekly" | "fortnightly" | "monthly";
}

export interface AccountSettingsSnapshot extends AccountSettings {
  version: number;
  updatedAt: string;
}

export interface AccountRepository {
  getSettings(userId: string): Promise<AccountSettingsSnapshot>;
  updateSettings(userId: string, settings: Partial<AccountSettings>, currentVersion: number): Promise<AccountMutationMeta>;
}
