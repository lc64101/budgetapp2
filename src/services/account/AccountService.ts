import type {
  AccountRepository,
  AccountSettings,
  AccountSettingsSnapshot,
  DashboardLayout,
} from "@/data/repositories/accountRepository";
import type { AccountMutationMeta } from "@/contracts/sync";

export class AccountService {
  constructor(private readonly accountRepository: AccountRepository) {}

  async getSettings(userId: string): Promise<AccountSettingsSnapshot> {
    return this.accountRepository.getSettings(userId);
  }

  async updateSettings(
    userId: string,
    settings: AccountSettings,
    expectedVersion: number,
  ): Promise<AccountMutationMeta> {
    return this.accountRepository.updateSettings(userId, settings, expectedVersion);
  }

  async updateDashboardLayout(
    userId: string,
    layout: DashboardLayout,
    expectedVersion: number,
  ): Promise<AccountMutationMeta> {
    return this.accountRepository.updateDashboardLayout(userId, layout, expectedVersion);
  }
}
