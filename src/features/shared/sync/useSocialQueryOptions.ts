import { SOCIAL_SYNC_POLICY } from "@/lib/sync/policies";

export function getSocialQueryTiming() {
  const intervalMs = SOCIAL_SYNC_POLICY.intervalMs ?? 60_000;

  return {
    staleTime: intervalMs,
    refetchInterval: intervalMs,
    refetchOnWindowFocus: true,
  };
}
