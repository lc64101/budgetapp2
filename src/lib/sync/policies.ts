import type { SyncPolicy } from "@/contracts/sync";

export const ACCOUNT_SYNC_POLICY: SyncPolicy = {
  scope: "account",
  mode: "realtime",
};

export const SOCIAL_SYNC_POLICY: SyncPolicy = {
  scope: "social",
  mode: "polling",
  intervalMs: 60_000,
};
