import { describe, expect, it } from "vitest";
import { applyAllocationChange, type AllocationValues } from "@/domain/budget/allocations";

function total(values: AllocationValues): number {
  return Number((values.spendingPct + values.savingPct + values.investingPct).toFixed(2));
}

describe("applyAllocationChange", () => {
  it("reduces spending first when saving increase overflows", () => {
    const next = applyAllocationChange(
      { spendingPct: 50, savingPct: 30, investingPct: 20 },
      "savingPct",
      60,
    );

    expect(next).toEqual({ spendingPct: 20, savingPct: 60, investingPct: 20 });
    expect(total(next)).toBe(100);
  });

  it("reduces investing after spending reaches zero for saving overflow", () => {
    const next = applyAllocationChange(
      { spendingPct: 0, savingPct: 60, investingPct: 40 },
      "savingPct",
      85,
    );

    expect(next).toEqual({ spendingPct: 0, savingPct: 85, investingPct: 15 });
    expect(total(next)).toBe(100);
  });

  it("reduces spending first when investing increase overflows", () => {
    const next = applyAllocationChange(
      { spendingPct: 45, savingPct: 35, investingPct: 20 },
      "investingPct",
      50,
    );

    expect(next).toEqual({ spendingPct: 15, savingPct: 35, investingPct: 50 });
    expect(total(next)).toBe(100);
  });

  it("reduces saving after spending reaches zero for investing overflow", () => {
    const next = applyAllocationChange(
      { spendingPct: 0, savingPct: 70, investingPct: 30 },
      "investingPct",
      65,
    );

    expect(next).toEqual({ spendingPct: 0, savingPct: 35, investingPct: 65 });
    expect(total(next)).toBe(100);
  });

  it("clamps spending to remaining percentage", () => {
    const next = applyAllocationChange(
      { spendingPct: 20, savingPct: 70, investingPct: 20 },
      "spendingPct",
      50,
    );

    expect(next).toEqual({ spendingPct: 50, savingPct: 50, investingPct: 0 });
    expect(total(next)).toBe(100);
  });

  it("reduces investing first when spending increases", () => {
    const next = applyAllocationChange(
      { spendingPct: 50, savingPct: 30, investingPct: 20 },
      "spendingPct",
      65,
    );

    expect(next).toEqual({ spendingPct: 65, savingPct: 30, investingPct: 5 });
    expect(total(next)).toBe(100);
  });

  it("reduces saving after investing reaches zero for spending overflow", () => {
    const next = applyAllocationChange(
      { spendingPct: 40, savingPct: 35, investingPct: 25 },
      "spendingPct",
      90,
    );

    expect(next).toEqual({ spendingPct: 90, savingPct: 10, investingPct: 0 });
    expect(total(next)).toBe(100);
  });

  it("never exceeds 100 total when values are out of range", () => {
    const next = applyAllocationChange(
      { spendingPct: 60, savingPct: 20, investingPct: 20 },
      "savingPct",
      160,
    );

    expect(next.savingPct).toBeLessThanOrEqual(100);
    expect(total(next)).toBe(100);
  });
});
