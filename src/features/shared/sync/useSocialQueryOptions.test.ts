import { describe, expect, it } from "vitest";
import { getSocialQueryTiming } from "@/features/shared/sync/useSocialQueryOptions";

describe("getSocialQueryTiming", () => {
  it("enforces one-minute social refresh cadence", () => {
    const timing = getSocialQueryTiming();

    expect(timing.staleTime).toBe(60_000);
    expect(timing.refetchInterval).toBe(60_000);
    expect(timing.refetchOnWindowFocus).toBe(true);
  });
});
