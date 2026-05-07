import type { ExpenseFrequency } from "@/services/budget/contracts";
import type { PayCycle } from "@/services/budget/contracts";

export interface AllocationInput {
  income: number;
  expenseTotal: number;
}

export interface AllocationResult {
  available: number;
  utilization: number;
}

export function calculateAllocationSummary(input: AllocationInput): AllocationResult {
  const available = input.income - input.expenseTotal;
  const utilization = input.income <= 0 ? 0 : Number(((input.expenseTotal / input.income) * 100).toFixed(2));

  return { available, utilization };
}

/**
 * How many times does an expense with `frequency` occur per `payCycle` period?
 * Using 52 weeks/year and 26 fortnights/year as the baseline.
 */
const FREQUENCY_MULTIPLIERS: Record<ExpenseFrequency, Record<PayCycle, number>> = {
  weekly:      { weekly: 1,       fortnightly: 2,       monthly: 52 / 12 },
  fortnightly: { weekly: 0.5,     fortnightly: 1,       monthly: 26 / 12 },
  monthly:     { weekly: 12 / 52, fortnightly: 12 / 26, monthly: 1       },
  annual:      { weekly: 1 / 52,  fortnightly: 1 / 26,  monthly: 1 / 12  },
  ongoing:     { weekly: 12 / 52, fortnightly: 12 / 26, monthly: 1       },
};

/**
 * Returns the amount of `amount` (billed at `frequency`) that falls within one `payCycle` period.
 */
export function normaliseToPayCycle(
  amount: number,
  frequency: ExpenseFrequency,
  payCycle: PayCycle,
): number {
  const multiplier = FREQUENCY_MULTIPLIERS[frequency][payCycle];
  return Number((amount * multiplier).toFixed(2));
}

