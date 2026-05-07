import type { AccountMutationMeta } from "@/contracts/sync";
import type {
  AccountSettings,
  AccountSettingsSnapshot,
  DashboardLayout,
} from "@/data/repositories/accountRepository";

export interface UpdateAccountSettingsRequest extends AccountSettings {
  expectedVersion: number;
}

export interface UpdateDashboardLayoutRequest {
  dashboardLayout: DashboardLayout;
  expectedVersion: number;
}

export interface AccountMutationResponse {
  meta: AccountMutationMeta;
}

export type GetAccountSettingsResponse = AccountSettingsSnapshot;

export interface AccountProfileResponse {
  username: string;
}

export interface UpdateUsernameRequest {
  username: string;
}

export interface UsernameAvailabilityResponse {
  available: boolean;
  normalizedUsername: string;
  reason?: string;
}