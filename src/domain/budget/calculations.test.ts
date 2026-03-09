import { describe, expect, it } from "vitest";
import { calculateAllocationSummary } from "@/domain/budget/calculations";

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
