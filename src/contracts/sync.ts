export type SyncMode = "realtime" | "polling";

export interface SyncPolicy {
  scope: "account" | "social";
  mode: SyncMode;
  intervalMs?: number;
}

export interface AccountMutationMeta {
  version: number;
  updatedAt: string;
  lastModifiedBySession: string;
}
