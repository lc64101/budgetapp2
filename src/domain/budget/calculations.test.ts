import { describe, expect, it } from "vitest";
import { calculateAllocationSummary, normaliseToPayCycle } from "@/domain/budget/calculations";

describe("calculateAllocationSummary", () => {
  it("computes available funds and utilization", () => {
    const result = calculateAllocationSummary({ income: 3000, expenseTotal: 900 });

    expect(result.available).toBe(2100);
    expect(result.utilization).toBe(30);
  });

  it("handles zero income safely", () => {
    const result = calculateAllocationSummary({ income: 0, expenseTotal: 500 });

    expect(result.available).toBe(-500);
    expect(result.utilization).toBe(0);
  });
});

describe("normaliseToPayCycle", () => {
  it("monthly expense → monthly pay cycle is 1:1", () => {
    expect(normaliseToPayCycle(100, "monthly", "monthly")).toBe(100);
  });

  it("annual expense ÷ 12 for monthly pay cycle", () => {
    expect(normaliseToPayCycle(120, "annual", "monthly")).toBeCloseTo(10, 2);
  });

  it("weekly expense × 52/12 for monthly pay cycle", () => {
    expect(normaliseToPayCycle(100, "weekly", "monthly")).toBeCloseTo(100 * (52 / 12), 2);
  });

  it("fortnightly expense ÷ 2 for weekly pay cycle", () => {
    expect(normaliseToPayCycle(200, "fortnightly", "weekly")).toBe(100);
  });

  it("ongoing treated same as monthly", () => {
    expect(normaliseToPayCycle(50, "ongoing", "monthly")).toBe(50);
    expect(normaliseToPayCycle(50, "ongoing", "weekly")).toBeCloseTo(50 * (12 / 52), 2);
  });

  it("monthly → fortnightly is income × 12/26", () => {
    expect(normaliseToPayCycle(300, "monthly", "fortnightly")).toBeCloseTo(300 * (12 / 26), 2);
  });

  it("returns zero for zero amount", () => {
    expect(normaliseToPayCycle(0, "annual", "monthly")).toBe(0);
    expect(normaliseToPayCycle(0, "weekly", "fortnightly")).toBe(0);
  });

  it("annual expense ÷ 52 for weekly pay cycle", () => {
    expect(normaliseToPayCycle(520, "annual", "weekly")).toBeCloseTo(10, 2);
  });
});
