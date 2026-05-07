import { describe, expect, it } from "vitest";
import {
  DEFAULT_DASHBOARD_MODULES,
  DASHBOARD_TILE_IDS,
  normalizeDashboardLayout,
} from "@/data/repositories/accountRepository";

describe("normalizeDashboardLayout", () => {
  it("applies default module set when modules are absent", () => {
    const result = normalizeDashboardLayout({
      order: ["focus", "available", "spent"],
      hidden: ["spent"],
    });

    expect(result.modules).toEqual(DEFAULT_DASHBOARD_MODULES);
  });

  it("filters invalid and duplicate module ids", () => {
    const result = normalizeDashboardLayout({
      modules: [
        "savings_total",
        "savings_total",
        "invalid_module",
        "spending_over_time",
      ],
    });

    expect(result.modules).toEqual(["savings_total", "spending_over_time"]);
  });

  it("retains complete tile order when malformed order is supplied", () => {
    const result = normalizeDashboardLayout({
      order: ["available", "unknown", "available"],
      hidden: [],
    });

    expect(result.order).toEqual(DASHBOARD_TILE_IDS);
  });

  it("drops invalid hidden tile ids", () => {
    const result = normalizeDashboardLayout({
      hidden: ["spent", "invalid"],
    });

    expect(result.hidden).toEqual(["spent"]);
  });
});
