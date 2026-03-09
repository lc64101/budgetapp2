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
