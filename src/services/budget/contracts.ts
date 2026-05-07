export type PayCycle = "weekly" | "fortnightly" | "monthly";

export type ExpenseFrequency = "weekly" | "fortnightly" | "monthly" | "annual" | "ongoing";

export interface ExpenseItem {
  id: string;
  description: string;
  vendor: string | null;
  frequency: ExpenseFrequency;
  amount: number;
  catalogPlanId: string | null;
  catalogPrice: number | null;
  userPrice: number | null;
  /** Resolved price used in all budget calculations: userPrice ?? catalogPrice ?? amount */
  effectivePrice: number;
  createdAt: string;
}

export interface CatalogPlan {
  id: string;
  providerName: string;
  planName: string;
  region: string;
  currency: string;
  catalogPrice: number;
  billingPeriod: ExpenseFrequency;
  displayRank: number;
}

export interface AddExpensePayload {
  description: string;
  vendor: string | null;
  frequency: ExpenseFrequency;
  amount: number;
  catalogPlanId: string | null;
  catalogPrice: number | null;
  userPrice: number | null;
}

export interface UpdateExpensePayload {
  description?: string;
  vendor?: string | null;
  frequency?: ExpenseFrequency;
  amount?: number;
  userPrice?: number | null;
}

export interface CalculatorSnapshot {
  payCycle: PayCycle;
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
}

export interface AllocationPlan {
  spendingPct: number;
  savingPct: number;
  investingPct: number;
}

export type AllocationMode = "slider" | "percent" | "value";

export interface ValueAllocationPlan {
  spendingAmount: number;
  savingAmount: number;
  investingAmount: number;
}

export interface AllocationModeDrafts {
  slider: AllocationPlan;
  percent: AllocationPlan;
  value: ValueAllocationPlan;
}

export interface PlannerSnapshot {
  calculator: CalculatorSnapshot;
  allocations: AllocationPlan;
  activeAllocationMode: AllocationMode;
  allocationModeDrafts: AllocationModeDrafts;
  available: number;
  utilization: number;
}

export interface SaveAllocationsRequest {
  allocations: AllocationPlan;
  activeMode: AllocationMode;
  modeDrafts: AllocationModeDrafts;
}

export interface PayEntry {
  id: string;
  payCycle: PayCycle;
  paymentDate: string;
  amount: number;
}

export interface AddPayEntryPayload {
  payCycle: PayCycle;
  paymentDate: string;
  amount: number;
}