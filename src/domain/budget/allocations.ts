export interface AllocationValues {
  spendingPct: number;
  savingPct: number;
  investingPct: number;
}

export type AllocationField = keyof AllocationValues;

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Number(value.toFixed(2))));
}

function normalize(values: AllocationValues): AllocationValues {
  return {
    spendingPct: clampPercent(values.spendingPct),
    savingPct: clampPercent(values.savingPct),
    investingPct: clampPercent(values.investingPct),
  };
}

export function applyAllocationChange(
  current: AllocationValues,
  field: AllocationField,
  nextValueRaw: number,
): AllocationValues {
  const nextValue = clampPercent(nextValueRaw);
  const next = normalize(current);

  if (field === "spendingPct") {
    next.spendingPct = nextValue;
    let overflow = next.spendingPct + next.savingPct + next.investingPct - 100;

    if (overflow > 0) {
      const investingCut = Math.min(next.investingPct, overflow);
      next.investingPct -= investingCut;
      overflow -= investingCut;
    }

    if (overflow > 0) {
      const savingCut = Math.min(next.savingPct, overflow);
      next.savingPct -= savingCut;
      overflow -= savingCut;
    }

    if (overflow > 0) {
      next.spendingPct = clampPercent(next.spendingPct - overflow);
    }

    return normalize(next);
  }

  if (field === "savingPct") {
    next.savingPct = nextValue;
    let overflow = next.spendingPct + next.savingPct + next.investingPct - 100;

    if (overflow > 0) {
      const spendingCut = Math.min(next.spendingPct, overflow);
      next.spendingPct -= spendingCut;
      overflow -= spendingCut;
    }

    if (overflow > 0) {
      const investingCut = Math.min(next.investingPct, overflow);
      next.investingPct -= investingCut;
      overflow -= investingCut;
    }

    if (overflow > 0) {
      next.savingPct = clampPercent(next.savingPct - overflow);
    }

    return normalize(next);
  }

  next.investingPct = nextValue;
  let overflow = next.spendingPct + next.savingPct + next.investingPct - 100;

  if (overflow > 0) {
    const spendingCut = Math.min(next.spendingPct, overflow);
    next.spendingPct -= spendingCut;
    overflow -= spendingCut;
  }

  if (overflow > 0) {
    const savingCut = Math.min(next.savingPct, overflow);
    next.savingPct -= savingCut;
    overflow -= savingCut;
  }

  if (overflow > 0) {
    next.investingPct = clampPercent(next.investingPct - overflow);
  }

  return normalize(next);
}
