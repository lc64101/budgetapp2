import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AddExpensePayload,
  AddPayEntryPayload,
  AllocationMode,
  AllocationModeDrafts,
  AllocationPlan,
  CalculatorSnapshot,
  CatalogPlan,
  ExpenseFrequency,
  ExpenseItem,
  PayCycle,
  PayEntry,
  PlannerSnapshot,
  SaveAllocationsRequest,
  UpdateExpensePayload,
  ValueAllocationPlan,
} from "@/services/budget/contracts";
import { normaliseToPayCycle } from "@/domain/budget/calculations";

const DEFAULT_ALLOCATIONS: AllocationPlan = {
  spendingPct: 50,
  savingPct: 30,
  investingPct: 20,
};

const DEFAULT_ACTIVE_ALLOCATION_MODE: AllocationMode = "slider";

const DEFAULT_CALCULATOR: CalculatorSnapshot = {
  payCycle: "monthly",
  income: 0,
  fixedExpenses: 0,
  variableExpenses: 0,
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isMissingRelationError(error: { code?: string; message?: string } | null, tableName: string): boolean {
  if (!error) {
    return false;
  }

  if (error.code === "42P01") {
    return true;
  }

  const message = String(error.message ?? "").toLowerCase();
  return message.includes("does not exist") && message.includes(tableName.toLowerCase());
}

function summarize(calculator: CalculatorSnapshot, allocations: AllocationPlan): PlannerSnapshot {
  const expenseTotal = calculator.fixedExpenses + calculator.variableExpenses;
  const available = calculator.income - expenseTotal;
  const utilization = calculator.income <= 0 ? 0 : Number(((expenseTotal / calculator.income) * 100).toFixed(2));

  const valueDraft: ValueAllocationPlan = {
    spendingAmount: Number(((available * DEFAULT_ALLOCATIONS.spendingPct) / 100).toFixed(2)),
    savingAmount: Number(((available * DEFAULT_ALLOCATIONS.savingPct) / 100).toFixed(2)),
    investingAmount: Number(((available * DEFAULT_ALLOCATIONS.investingPct) / 100).toFixed(2)),
  };

  return {
    calculator,
    allocations,
    activeAllocationMode: DEFAULT_ACTIVE_ALLOCATION_MODE,
    allocationModeDrafts: {
      slider: DEFAULT_ALLOCATIONS,
      percent: DEFAULT_ALLOCATIONS,
      value: valueDraft,
    },
    available,
    utilization,
  };
}

function toAllocationPlan(input: unknown, fallback: AllocationPlan): AllocationPlan {
  if (!input || typeof input !== "object") {
    return fallback;
  }

  return {
    spendingPct: toNumber((input as { spendingPct?: unknown }).spendingPct ?? fallback.spendingPct),
    savingPct: toNumber((input as { savingPct?: unknown }).savingPct ?? fallback.savingPct),
    investingPct: toNumber((input as { investingPct?: unknown }).investingPct ?? fallback.investingPct),
  };
}

function toValueAllocationPlan(input: unknown, fallback: ValueAllocationPlan): ValueAllocationPlan {
  if (!input || typeof input !== "object") {
    return fallback;
  }

  return {
    spendingAmount: toNumber((input as { spendingAmount?: unknown }).spendingAmount ?? fallback.spendingAmount),
    savingAmount: toNumber((input as { savingAmount?: unknown }).savingAmount ?? fallback.savingAmount),
    investingAmount: toNumber((input as { investingAmount?: unknown }).investingAmount ?? fallback.investingAmount),
  };
}

function toMode(value: unknown, fallback: AllocationMode): AllocationMode {
  return value === "slider" || value === "percent" || value === "value" ? value : fallback;
}

function normalizeAllocationModeDrafts(
  input: unknown,
  fallbackPlan: AllocationPlan,
  available: number,
): AllocationModeDrafts {
  const fallbackValue: ValueAllocationPlan = {
    spendingAmount: Number(((available * fallbackPlan.spendingPct) / 100).toFixed(2)),
    savingAmount: Number(((available * fallbackPlan.savingPct) / 100).toFixed(2)),
    investingAmount: Number(((available * fallbackPlan.investingPct) / 100).toFixed(2)),
  };

  if (!input || typeof input !== "object") {
    return {
      slider: fallbackPlan,
      percent: fallbackPlan,
      value: fallbackValue,
    };
  }

  return {
    slider: toAllocationPlan((input as { slider?: unknown }).slider, fallbackPlan),
    percent: toAllocationPlan((input as { percent?: unknown }).percent, fallbackPlan),
    value: toValueAllocationPlan((input as { value?: unknown }).value, fallbackValue),
  };
}

function cycleEndDate(startIso: string, cycle: PayCycle): string {
  const start = new Date(startIso);
  const end = new Date(startIso);
  const days = cycle === "weekly" ? 6 : cycle === "fortnightly" ? 13 : 29;
  end.setDate(start.getDate() + days);
  return end.toISOString().slice(0, 10);
}

export class BudgetService {
  constructor(private readonly supabase: SupabaseClient) {}

  async getPlannerSnapshot(userId: string): Promise<PlannerSnapshot> {
    const { data: periods, error: periodError } = await this.supabase
      .from("budget_periods")
      .select("id,income,cycle,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (periodError) {
      if (isMissingRelationError(periodError, "budget_periods")) {
        return summarize(DEFAULT_CALCULATOR, DEFAULT_ALLOCATIONS);
      }
      throw new Error(`Failed to load planner data: ${periodError.message}`);
    }

    const latest = periods?.[0] as
      | {
          id: string;
          income: number;
          cycle?: PayCycle;
        }
      | undefined;

    const payCycle: PayCycle = latest?.cycle ?? "monthly";

    // Load user-level expense items (budget_period_id IS NULL = new model)
    const { data: expenseRows, error: expenseError } = await this.supabase
      .from("expenses")
      .select("id,frequency,amount,catalog_price,user_price")
      .eq("user_id", userId)
      .is("budget_period_id", null);

    let totalExpenses = 0;

    if (expenseError) {
      if (!isMissingRelationError(expenseError, "expenses")) {
        throw new Error(`Failed to load expense totals: ${expenseError.message}`);
      }
    } else {
      for (const row of expenseRows ?? []) {
        const r = row as { amount: unknown; frequency: unknown; catalog_price: unknown; user_price: unknown };
        const effective = toNumber(r.user_price ?? r.catalog_price ?? r.amount);
        const freq = (String(r.frequency ?? "monthly")) as ExpenseFrequency;
        totalExpenses += normaliseToPayCycle(effective, freq, payCycle);
      }
      totalExpenses = Number(totalExpenses.toFixed(2));
    }

    const [allocationResult, modePreferenceResult] = await Promise.all([
      this.supabase
        .from("budget_allocations")
        .select("spending_pct,saving_pct,investing_pct")
        .eq("user_id", userId)
        .maybeSingle(),
      this.supabase
        .from("budget_allocation_preferences")
        .select("active_mode,mode_payload")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const allocationRow = allocationResult.data;
    const allocationError = allocationResult.error;

    if (allocationError && !isMissingRelationError(allocationError, "budget_allocations")) {
      throw new Error(`Failed to load allocation plan: ${allocationError.message}`);
    }

    const calculator: CalculatorSnapshot = {
      payCycle,
      income: latest ? toNumber(latest.income) : 0,
      fixedExpenses: totalExpenses,
      variableExpenses: 0,
    };

    const expenseTotal = calculator.fixedExpenses;
    const available = calculator.income - expenseTotal;

    const allocations: AllocationPlan = allocationRow
      ? {
          spendingPct: toNumber((allocationRow as { spending_pct: unknown }).spending_pct),
          savingPct: toNumber((allocationRow as { saving_pct: unknown }).saving_pct),
          investingPct: toNumber((allocationRow as { investing_pct: unknown }).investing_pct),
        }
      : DEFAULT_ALLOCATIONS;

    let activeAllocationMode: AllocationMode = DEFAULT_ACTIVE_ALLOCATION_MODE;
    let allocationModeDrafts = normalizeAllocationModeDrafts(null, allocations, available);

    const modePreferenceRow = modePreferenceResult.data;
    const modePreferenceError = modePreferenceResult.error;

    if (modePreferenceError && !isMissingRelationError(modePreferenceError, "budget_allocation_preferences")) {
      throw new Error(`Failed to load allocation mode preferences: ${modePreferenceError.message}`);
    }

    if (modePreferenceRow) {
      activeAllocationMode = toMode((modePreferenceRow as { active_mode?: unknown }).active_mode, activeAllocationMode);
      allocationModeDrafts = normalizeAllocationModeDrafts(
        (modePreferenceRow as { mode_payload?: unknown }).mode_payload,
        allocations,
        available,
      );
    }

    return {
      calculator,
      allocations,
      activeAllocationMode,
      allocationModeDrafts,
      available,
      utilization: calculator.income <= 0 ? 0 : Number(((expenseTotal / calculator.income) * 100).toFixed(2)),
    };
  }

  async saveCalculator(userId: string, calculator: CalculatorSnapshot): Promise<void> {
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = cycleEndDate(startDate, calculator.payCycle);
    const sessionId = globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;

    const { error: periodInsertError } = await this.supabase
      .from("budget_periods")
      .insert({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        income: calculator.income,
        cycle: calculator.payCycle,
        last_modified_by_session: sessionId,
      } as never);

    if (periodInsertError) {
      throw new Error(`Failed to save calculator period: ${periodInsertError.message}`);
    }

    // Expense items are now managed via the /api/budget/expenses CRUD endpoints.
    // Historical metrics are refreshed asynchronously when expenses change.
    const today = new Date().toISOString().slice(0, 10);
    const expenseTotal = calculator.fixedExpenses;
    const utilization = calculator.income <= 0 ? 0 : (expenseTotal / calculator.income) * 100;
    const savingsRate = calculator.income <= 0 ? 0 : Math.max(0, ((calculator.income - expenseTotal) / calculator.income) * 100);
    const spendingScore = Math.max(0, 100 - utilization);

    await this.supabase.from("historical_metrics").delete().eq("user_id", userId).eq("recorded_on", today);
    await this.supabase.from("historical_metrics").insert({
      user_id: userId,
      recorded_on: today,
      savings_rate: Number(savingsRate.toFixed(2)),
      spending_score: Number(spendingScore.toFixed(2)),
    } as never);
  }

  async saveAllocations(userId: string, input: SaveAllocationsRequest): Promise<void> {
    const total = input.allocations.spendingPct + input.allocations.savingPct + input.allocations.investingPct;
    if (Math.abs(total - 100) > 0.001) {
      throw new Error("Allocations must add up to 100%");
    }

    const { error } = await this.supabase.from("budget_allocations").upsert(
      {
        user_id: userId,
        spending_pct: input.allocations.spendingPct,
        saving_pct: input.allocations.savingPct,
        investing_pct: input.allocations.investingPct,
      } as never,
      { onConflict: "user_id" },
    );

    if (error) {
      if (error.message.includes("budget_allocations")) {
        throw new Error("Budget allocation persistence is unavailable until the latest migration is applied.");
      }
      throw new Error(`Failed to save allocation plan: ${error.message}`);
    }

    const { error: modePreferenceError } = await this.supabase.from("budget_allocation_preferences").upsert(
      {
        user_id: userId,
        active_mode: input.activeMode,
        mode_payload: input.modeDrafts,
      } as never,
      { onConflict: "user_id" },
    );

    if (modePreferenceError && !isMissingRelationError(modePreferenceError, "budget_allocation_preferences")) {
      throw new Error(`Failed to save allocation mode preferences: ${modePreferenceError.message}`);
    }
  }

  async getPayEntries(userId: string): Promise<PayEntry[]> {
    const { data, error } = await this.supabase
      .from("pay_entries")
      .select("id,pay_cycle,payment_date,amount")
      .eq("user_id", userId)
      .order("payment_date", { ascending: false })
      .limit(200);

    if (error) {
      if (isMissingRelationError(error, "pay_entries")) {
        return [];
      }

      throw new Error(`Failed to load pay entries: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: String((row as { id: unknown }).id),
      payCycle: String((row as { pay_cycle: unknown }).pay_cycle) as PayCycle,
      paymentDate: String((row as { payment_date: unknown }).payment_date),
      amount: toNumber((row as { amount: unknown }).amount),
    }));
  }

  async addPayEntry(userId: string, entry: AddPayEntryPayload): Promise<void> {
    const { error } = await this.supabase.from("pay_entries").insert({
      user_id: userId,
      pay_cycle: entry.payCycle,
      payment_date: entry.paymentDate,
      amount: Number(entry.amount.toFixed(2)),
    } as never);

    if (error) {
      if (isMissingRelationError(error, "pay_entries")) {
        throw new Error("Pay entry history is unavailable until the latest migration is applied.");
      }
      throw new Error(`Failed to save pay entry: ${error.message}`);
    }
  }

  // ── Expense item CRUD ────────────────────────────────────────────────────────

  async getExpenses(userId: string): Promise<ExpenseItem[]> {
    const { data, error } = await this.supabase
      .from("expenses")
      .select("id,description,vendor,frequency,amount,catalog_plan_id,catalog_price,user_price,created_at")
      .eq("user_id", userId)
      .is("budget_period_id", null)
      .order("created_at", { ascending: true });

    if (error) {
      if (isMissingRelationError(error, "expenses")) return [];
      throw new Error(`Failed to load expenses: ${error.message}`);
    }

    return (data ?? []).map((row) => {
      const r = row as {
        id: string;
        description: string | null;
        vendor: string | null;
        frequency: string | null;
        amount: number;
        catalog_plan_id: string | null;
        catalog_price: number | null;
        user_price: number | null;
        created_at: string;
      };
      const effective = toNumber(r.user_price ?? r.catalog_price ?? r.amount);
      return {
        id: r.id,
        description: r.description ?? "",
        vendor: r.vendor,
        frequency: (r.frequency ?? "monthly") as ExpenseFrequency,
        amount: toNumber(r.amount),
        catalogPlanId: r.catalog_plan_id,
        catalogPrice: r.catalog_price,
        userPrice: r.user_price,
        effectivePrice: effective,
        createdAt: r.created_at,
      };
    });
  }

  async addExpense(userId: string, payload: AddExpensePayload): Promise<ExpenseItem> {
    const sessionId = globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
    const { data, error } = await this.supabase
      .from("expenses")
      .insert({
        user_id: userId,
        budget_period_id: null,
        category: "expense",
        description: payload.description,
        vendor: payload.vendor ?? null,
        frequency: payload.frequency,
        amount: Number(payload.amount.toFixed(2)),
        catalog_plan_id: payload.catalogPlanId ?? null,
        catalog_price: payload.catalogPrice ?? null,
        user_price: payload.userPrice ?? null,
        last_modified_by_session: sessionId,
      } as never)
      .select("id,description,vendor,frequency,amount,catalog_plan_id,catalog_price,user_price,created_at")
      .single();

    if (error) throw new Error(`Failed to add expense: ${error.message}`);

    const r = data as {
      id: string;
      description: string | null;
      vendor: string | null;
      frequency: string | null;
      amount: number;
      catalog_plan_id: string | null;
      catalog_price: number | null;
      user_price: number | null;
      created_at: string;
    };
    const effective = toNumber(r.user_price ?? r.catalog_price ?? r.amount);
    return {
      id: r.id,
      description: r.description ?? "",
      vendor: r.vendor,
      frequency: (r.frequency ?? "monthly") as ExpenseFrequency,
      amount: toNumber(r.amount),
      catalogPlanId: r.catalog_plan_id,
      catalogPrice: r.catalog_price,
      userPrice: r.user_price,
      effectivePrice: effective,
      createdAt: r.created_at,
    };
  }

  async updateExpense(userId: string, id: string, payload: UpdateExpensePayload): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (payload.description !== undefined) patch.description = payload.description;
    if (payload.vendor !== undefined) patch.vendor = payload.vendor;
    if (payload.frequency !== undefined) patch.frequency = payload.frequency;
    if (payload.amount !== undefined) patch.amount = Number(payload.amount.toFixed(2));
    if ("userPrice" in payload) patch.user_price = payload.userPrice ?? null;

    const { error } = await this.supabase
      .from("expenses")
      .update(patch as never)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to update expense: ${error.message}`);
  }

  async deleteExpense(userId: string, id: string): Promise<void> {
    const { error } = await this.supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete expense: ${error.message}`);
  }

  // ── Subscription catalog ─────────────────────────────────────────────────────

  async getCatalog(opts: { q?: string; region: string; top?: boolean }): Promise<CatalogPlan[]> {
    let query = this.supabase
      .from("subscription_catalog")
      .select("id,provider_name,plan_name,region,currency,catalog_price,billing_period,display_rank")
      .eq("region", opts.region)
      .eq("status", "active")
      .order("display_rank", { ascending: true });

    if (opts.q && opts.q.trim().length > 0) {
      query = query.ilike("provider_name", `%${opts.q.trim()}%`);
    }

    if (opts.top) {
      query = query.limit(20);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingRelationError(error, "subscription_catalog")) return [];
      throw new Error(`Failed to load subscription catalog: ${error.message}`);
    }

    return (data ?? []).map((row) => {
      const r = row as {
        id: string;
        provider_name: string;
        plan_name: string;
        region: string;
        currency: string;
        catalog_price: number;
        billing_period: string;
        display_rank: number;
      };
      return {
        id: r.id,
        providerName: r.provider_name,
        planName: r.plan_name,
        region: r.region,
        currency: r.currency,
        catalogPrice: toNumber(r.catalog_price),
        billingPeriod: r.billing_period as ExpenseFrequency,
        displayRank: r.display_rank,
      };
    });
  }
}