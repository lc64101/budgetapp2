"use client";

import { useMemo, useState } from "react";
import { CalculatorSectionNav } from "@/components/CalculatorSectionNav";
import { useCurrentUser } from "@/features/account/useCurrentUser";
import { usePlannerData, type PayCycle } from "@/features/budget/usePlannerData";
import { useExpenses, useCatalog } from "@/features/budget/useExpenses";
import { useGlobalError } from "@/features/shared/errors/GlobalErrorProvider";
import { normaliseToPayCycle } from "@/domain/budget/calculations";
import type { CatalogPlan, ExpenseFrequency, ExpenseItem } from "@/services/budget/contracts";
import { SegmentedPicker } from "@/components/SegmentedPicker";

type CalculatorTab = "income" | "expenses";

const PAY_CYCLE_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
];

const HISTORY_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
];

const EXPENSE_FREQ_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
  { value: "ongoing", label: "Ongoing" },
];

const FREQ_LABELS: Record<ExpenseFrequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  annual: "Annual",
  ongoing: "Ongoing",
};

const DEFAULT_REGION = "AU";

export default function CalculatorPage() {
  const { userId, isLoading: isLoadingUser } = useCurrentUser();
  const {
    planner,
    saveCalculator,
    isSavingCalculator,
    clientInitError,
    payEntries,
    addPayEntry,
    isSavingPayEntry,
  } = usePlannerData(userId ?? "");

  if (clientInitError) {
    return <div className="app-loading">{clientInitError}</div>;
  }

  if (isLoadingUser || planner.isLoading) {
    return <div className="app-loading">Loading calculator...</div>;
  }

  if (!userId || planner.error || !planner.data) {
    return <div className="app-loading">Unable to load calculator planner.</div>;
  }

  return (
    <CalculatorWorkspace
      key={`${planner.data.calculator.payCycle}-${planner.data.calculator.income}`}
      initialPayCycle={planner.data.calculator.payCycle}
      initialIncome={planner.data.calculator.income}
      saveCalculator={saveCalculator}
      isSavingCalculator={isSavingCalculator}
      payEntries={payEntries.data ?? []}
      addPayEntry={addPayEntry}
      isSavingPayEntry={isSavingPayEntry}
      userId={userId}
    />
  );
}

function CalculatorWorkspace({
  initialPayCycle,
  initialIncome,
  saveCalculator,
  isSavingCalculator,
  payEntries,
  addPayEntry,
  isSavingPayEntry,
  userId,
}: {
  initialPayCycle: PayCycle;
  initialIncome: number;
  saveCalculator: (input: {
    payCycle: PayCycle;
    income: number;
    fixedExpenses: number;
    variableExpenses: number;
  }) => Promise<void>;
  isSavingCalculator: boolean;
  payEntries: Array<{ id: string; payCycle: PayCycle; paymentDate: string; amount: number }>;
  addPayEntry: (input: { payCycle: PayCycle; paymentDate: string; amount: number }) => Promise<void>;
  isSavingPayEntry: boolean;
  userId: string;
}) {
  const { reportError } = useGlobalError();
  const [tab, setTab] = useState<CalculatorTab>("income");

  const [payCycle, setPayCycle] = useState<PayCycle>(initialPayCycle);
  const [paychequeValue, setPaychequeValue] = useState(initialIncome ? String(initialIncome) : "");

  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entryAmount, setEntryAmount] = useState("");
  const [historyCycleFilter, setHistoryCycleFilter] = useState<"all" | PayCycle>("all");

  const income = Number(paychequeValue) || 0;
  const cycleMultiplier = payCycle === "weekly" ? 4.33 : payCycle === "fortnightly" ? 2.17 : 1;
  const monthlyEstimate = income * cycleMultiplier;

  const filteredEntries = useMemo(
    () =>
      payEntries.filter((entry) => {
        if (historyCycleFilter === "all") return true;
        return entry.payCycle === historyCycleFilter;
      }),
    [historyCycleFilter, payEntries],
  );

  return (
    <section className="page">
      <div className="page-header">
        <h1>Budget Calculator</h1>
      </div>

      <CalculatorSectionNav mode={tab} onModeChange={setTab} />
      <p className="muted">
        {tab === "income"
          ? "Step 1: set income frequency and take-home amount."
          : "Step 2: add your recurring expenses and subscriptions."}
      </p>

      {tab === "income" ? (
        <>
          <div className="card calc-card">
            <h2 className="calc-section-title">Income</h2>

            <div className="form-group">
              <label>Income payment frequency</label>
              <SegmentedPicker
                value={payCycle}
                options={PAY_CYCLE_OPTIONS}
                onChange={(v) => setPayCycle(v as PayCycle)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="paycheque-value">Paycheque value (take-home)</label>
              <input
                id="paycheque-value"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={paychequeValue}
                onChange={(event) => setPaychequeValue(event.target.value)}
              />
            </div>
          </div>

          <div className="card highlight-card">
            <span className="stat-label">Estimated Monthly Income</span>
            <p className="highlight-value">${monthlyEstimate.toFixed(2)}</p>
            <p className="muted">Used as your baseline for expenses, allocations, and social score.</p>
            <div className="dashboard-actions" style={{ marginTop: "0.8rem" }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSavingCalculator}
                onClick={async () => {
                  try {
                    await saveCalculator({ payCycle, income, fixedExpenses: 0, variableExpenses: 0 });
                  } catch (error) {
                    reportError(error instanceof Error ? error.message : "Unable to save income values.");
                  }
                }}
              >
                {isSavingCalculator ? "Saving..." : "Save Income"}
              </button>
            </div>
          </div>

          <div className="card calc-card">
            <h2 className="calc-section-title">Record Payment Received</h2>
            <p className="muted">After each payment date, log the amount received to keep historical cycle data.</p>

            <div className="form-group">
              <label htmlFor="pay-entry-date">Payment date</label>
              <input
                id="pay-entry-date"
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pay-entry-amount">Amount received</label>
              <input
                id="pay-entry-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={entryAmount}
                onChange={(event) => setEntryAmount(event.target.value)}
              />
            </div>

            <div className="dashboard-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSavingPayEntry}
                onClick={async () => {
                  const parsed = Number(entryAmount);
                  if (!entryDate || !Number.isFinite(parsed) || parsed <= 0) {
                    reportError("Enter a valid payment date and amount.");
                    return;
                  }
                  try {
                    await addPayEntry({ payCycle, paymentDate: entryDate, amount: parsed });
                    setEntryAmount("");
                  } catch (error) {
                    reportError(error instanceof Error ? error.message : "Unable to save pay entry.");
                  }
                }}
              >
                {isSavingPayEntry ? "Saving..." : "Save Payment Entry"}
              </button>
            </div>
          </div>

          <div className="card list-card">
            <h2 className="calc-section-title">Income History</h2>
            <div className="form-group">
              <label>View by cycle</label>
              <SegmentedPicker
                value={historyCycleFilter}
                options={HISTORY_FILTER_OPTIONS}
                onChange={(v) => setHistoryCycleFilter(v as "all" | PayCycle)}
              />
            </div>

            {filteredEntries.length === 0 ? <p className="muted">No payment entries recorded yet.</p> : null}

            {filteredEntries.map((entry) => (
              <div className="list-item" key={entry.id}>
                <div>
                  <span className="list-title">
                    {entry.payCycle.charAt(0).toUpperCase() + entry.payCycle.slice(1)} cycle
                  </span>
                  <span className="list-subtle">Paid on {entry.paymentDate}</span>
                </div>
                <span className="chip">${entry.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <ExpensesTab payCycle={payCycle} income={income} userId={userId} />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expenses tab
// ─────────────────────────────────────────────────────────────────────────────

function ExpensesTab({ payCycle, income, userId }: { payCycle: PayCycle; income: number; userId: string }) {
  const { expenses, addExpense, updateExpense, deleteExpense, isAddingExpense, isDeletingExpense } =
    useExpenses(userId);
  const { reportError } = useGlobalError();
  const [showModal, setShowModal] = useState(false);

  const items = useMemo(() => expenses.data ?? [], [expenses.data]);

  const totalExpenses = useMemo(
    () =>
      Number(
        items
          .reduce((sum, item) => sum + normaliseToPayCycle(item.effectivePrice, item.frequency, payCycle), 0)
          .toFixed(2),
      ),
    [items, payCycle],
  );

  const remaining = income - totalExpenses;

  return (
    <>
      <div className="card calc-card">
        <h2 className="calc-section-title">Your Expenses</h2>

        {expenses.isLoading ? (
          <p className="muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="expense-empty">No expenses added yet. Tap below to get started.</p>
        ) : (
          <div>
            {items.map((item) => (
              <ExpenseRow
                key={item.id}
                item={item}
                payCycle={payCycle}
                onDelete={async () => {
                  try {
                    await deleteExpense(item.id);
                  } catch (error) {
                    reportError(error instanceof Error ? error.message : "Unable to delete expense.");
                  }
                }}
                onPriceUpdate={async (newPrice) => {
                  try {
                    await updateExpense({ id: item.id, patch: { userPrice: newPrice } });
                  } catch (error) {
                    reportError(error instanceof Error ? error.message : "Unable to update price.");
                  }
                }}
                isDeleting={isDeletingExpense}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className="add-expense-btn"
          onClick={() => setShowModal(true)}
        >
          + Add an expense
        </button>
      </div>

      <div className="card highlight-card">
        <span className="stat-label">Expense Snapshot</span>
        <p className="highlight-value">${totalExpenses.toFixed(2)}</p>
        <p className="muted">
          Per {payCycle} pay cycle · Remaining after expenses: ${Math.max(0, remaining).toFixed(2)}
        </p>
      </div>

      {showModal && (
        <AddExpenseModal
          payCycle={payCycle}
          isAdding={isAddingExpense}
          onClose={() => setShowModal(false)}
          onAdd={async (payload) => {
            try {
              await addExpense(payload);
              setShowModal(false);
            } catch (error) {
              reportError(error instanceof Error ? error.message : "Unable to add expense.");
            }
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single expense row with inline price edit
// ─────────────────────────────────────────────────────────────────────────────

function ExpenseRow({
  item,
  payCycle,
  onDelete,
  onPriceUpdate,
  isDeleting,
}: {
  item: ExpenseItem;
  payCycle: PayCycle;
  onDelete: () => void;
  onPriceUpdate: (price: number) => void;
  isDeleting: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(item.effectivePrice));

  const isCustomPrice = item.userPrice !== null && item.userPrice !== item.catalogPrice;
  const normalisedAmount = normaliseToPayCycle(item.effectivePrice, item.frequency, payCycle);
  const initials = (item.vendor ?? item.description).slice(0, 2).toUpperCase();

  return (
    <div className="expense-item">
      <div className="expense-item-icon">{initials}</div>
      <div className="expense-item-body">
        <div className="expense-item-name">{item.description}</div>
        <div className="expense-item-meta">
          <span className="freq-badge">{FREQ_LABELS[item.frequency]}</span>
          {isCustomPrice && <span className="custom-price-badge">Custom price</span>}
          {item.vendor && item.vendor !== item.description && <span>{item.vendor}</span>}
        </div>
      </div>
      <div className="expense-item-right">
        {editing ? (
          <div className="expense-inline-edit">
            <input
              className="expense-inline-input"
              type="number"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <button
              className="expense-inline-save"
              type="button"
              onClick={() => {
                const parsed = Number(draft);
                if (Number.isFinite(parsed) && parsed >= 0) onPriceUpdate(parsed);
                setEditing(false);
              }}
            >
              ✓
            </button>
            <button
              className="expense-inline-cancel"
              type="button"
              onClick={() => { setDraft(String(item.effectivePrice)); setEditing(false); }}
            >
              ✕
            </button>
          </div>
        ) : (
          <span
            className="expense-item-price"
            title="Click to edit price"
            onClick={() => { setDraft(String(item.effectivePrice)); setEditing(true); }}
          >
            ${item.effectivePrice.toFixed(2)}
          </span>
        )}
        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
          ≈ ${normalisedAmount.toFixed(2)} / {payCycle.slice(0, 2)}
        </span>
        <button
          className="expense-item-delete"
          type="button"
          disabled={isDeleting}
          onClick={onDelete}
          aria-label={`Remove ${item.description}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add expense modal
// ─────────────────────────────────────────────────────────────────────────────

type ModalTab = "subscription" | "custom";
type SubStep = "search" | "plans" | "confirm";

function AddExpenseModal({
  payCycle,
  isAdding,
  onClose,
  onAdd,
}: {
  payCycle: PayCycle;
  isAdding: boolean;
  onClose: () => void;
  onAdd: (payload: {
    description: string;
    vendor: string | null;
    frequency: ExpenseFrequency;
    amount: number;
    catalogPlanId: string | null;
    catalogPrice: number | null;
    userPrice: number | null;
  }) => void;
}) {
  const [modalTab, setModalTab] = useState<ModalTab>("subscription");

  return (
    <div className="expense-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="expense-modal" role="dialog" aria-modal="true" aria-label="Add an expense">
        <div className="expense-modal-header">
          <h2>Add an expense</h2>
          <button className="expense-modal-close" type="button" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="expense-modal-body">
          <div className="expense-tabs">
            <button
              type="button"
              className={`expense-tab${modalTab === "subscription" ? " active" : ""}`}
              onClick={() => setModalTab("subscription")}
            >
              🔍 Subscription
            </button>
            <button
              type="button"
              className={`expense-tab${modalTab === "custom" ? " active" : ""}`}
              onClick={() => setModalTab("custom")}
            >
              ✏️ Custom
            </button>
          </div>

          {modalTab === "subscription" ? (
            <SubscriptionFlow payCycle={payCycle} isAdding={isAdding} onAdd={onAdd} />
          ) : (
            <CustomExpenseForm isAdding={isAdding} onAdd={onAdd} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription search + plan picker flow
// ─────────────────────────────────────────────────────────────────────────────

function SubscriptionFlow({
  payCycle,
  isAdding,
  onAdd,
}: {
  payCycle: PayCycle;
  isAdding: boolean;
  onAdd: (payload: {
    description: string;
    vendor: string | null;
    frequency: ExpenseFrequency;
    amount: number;
    catalogPlanId: string | null;
    catalogPrice: number | null;
    userPrice: number | null;
  }) => void;
}) {
  const catalog = useCatalog(DEFAULT_REGION);
  const allPlans = useMemo(() => catalog.data ?? [], [catalog.data]);

  const [step, setStep] = useState<SubStep>("search");
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<CatalogPlan | null>(null);

  // Confirm step state
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmPrice, setConfirmPrice] = useState("");
  const [confirmFrequency, setConfirmFrequency] = useState<ExpenseFrequency>("monthly");

  // Unique providers in rank order
  const topProviders = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of allPlans) {
      if (!seen.has(p.providerName)) {
        seen.add(p.providerName);
        result.push(p.providerName);
      }
      if (result.length >= 18) break;
    }
    return result;
  }, [allPlans]);

  const filteredProviders = useMemo(() => {
    if (!search.trim()) return topProviders;
    const q = search.trim().toLowerCase();
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of allPlans) {
      if (p.providerName.toLowerCase().includes(q) && !seen.has(p.providerName)) {
        seen.add(p.providerName);
        result.push(p.providerName);
      }
    }
    return result;
  }, [search, allPlans, topProviders]);

  const plansForProvider = useMemo(
    () => allPlans.filter((p) => p.providerName === selectedProvider),
    [allPlans, selectedProvider],
  );

  function handleProviderSelect(provider: string) {
    setSelectedProvider(provider);
    setStep("plans");
  }

  function handlePlanSelect(plan: CatalogPlan) {
    setSelectedPlan(plan);
    setConfirmDescription(`${plan.providerName} ${plan.planName}`);
    setConfirmPrice(String(plan.catalogPrice));
    setConfirmFrequency(plan.billingPeriod);
    setStep("confirm");
  }

  function handleConfirmAdd() {
    if (!selectedPlan) return;
    const priceNum = Number(confirmPrice);
    const isOverride = Number.isFinite(priceNum) && priceNum !== selectedPlan.catalogPrice;
    onAdd({
      description: confirmDescription.trim() || `${selectedPlan.providerName} ${selectedPlan.planName}`,
      vendor: selectedPlan.providerName,
      frequency: confirmFrequency,
      amount: selectedPlan.catalogPrice,
      catalogPlanId: selectedPlan.id,
      catalogPrice: selectedPlan.catalogPrice,
      userPrice: isOverride && Number.isFinite(priceNum) ? priceNum : null,
    });
  }

  if (step === "plans") {
    return (
      <>
        <button className="expense-back-btn" type="button" onClick={() => setStep("search")}>
          ← Back
        </button>
        <p className="expense-top-label">{selectedProvider} plans</p>
        <div className="expense-plan-list">
          {plansForProvider.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className="expense-plan-item"
              onClick={() => handlePlanSelect(plan)}
            >
              <span className="expense-plan-item-name">{plan.planName}</span>
              <span className="expense-plan-item-price">
                AUD ${plan.catalogPrice} / {FREQ_LABELS[plan.billingPeriod].toLowerCase()}
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  if (step === "confirm" && selectedPlan) {
    const enteredPrice = Number(confirmPrice);
    const isOverride = Number.isFinite(enteredPrice) && enteredPrice !== selectedPlan.catalogPrice;

    return (
      <>
        <button className="expense-back-btn" type="button" onClick={() => setStep("plans")}>
          ← Back
        </button>
        <p className="expense-confirm-provider">{selectedPlan.providerName}</p>

        <div className="form-group">
          <label htmlFor="conf-desc">Description</label>
          <input
            id="conf-desc"
            type="text"
            value={confirmDescription}
            onChange={(e) => setConfirmDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="conf-price">
            Price (AUD)
            {isOverride && (
              <span className="custom-price-badge" style={{ marginLeft: "0.5rem" }}>
                Custom — catalog is AUD ${selectedPlan.catalogPrice}
              </span>
            )}
          </label>
          <input
            id="conf-price"
            type="number"
            inputMode="decimal"
            value={confirmPrice}
            onChange={(e) => setConfirmPrice(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Billing frequency</label>
          <SegmentedPicker
            value={confirmFrequency}
            options={EXPENSE_FREQ_OPTIONS}
            onChange={(v) => setConfirmFrequency(v as ExpenseFrequency)}
          />
        </div>

        <p className="muted" style={{ fontSize: "0.8rem" }}>
          ≈ ${normaliseToPayCycle(
            Number.isFinite(enteredPrice) ? enteredPrice : selectedPlan.catalogPrice,
            confirmFrequency,
            payCycle,
          ).toFixed(2)} per {payCycle} pay cycle
        </p>

        <div className="dashboard-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={isAdding || !confirmDescription.trim()}
            onClick={handleConfirmAdd}
          >
            {isAdding ? "Adding…" : "Add to expenses"}
          </button>
        </div>
      </>
    );
  }

  // Search step (default)
  return (
    <>
      <div className="expense-search-wrap">
        <input
          className="expense-search-input"
          type="search"
          placeholder="Search Netflix, Spotify, iCloud…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {catalog.isLoading ? (
        <p className="muted">Loading subscriptions…</p>
      ) : (
        <>
          <p className="expense-top-label">
            {search.trim() ? "Results" : "Top subscriptions"}
          </p>
          {filteredProviders.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.85rem" }}>No matching provider found.</p>
          ) : (
            <div className="expense-provider-grid">
              {filteredProviders.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  className="expense-provider-btn"
                  onClick={() => handleProviderSelect(provider)}
                >
                  {provider}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom expense form
// ─────────────────────────────────────────────────────────────────────────────

function CustomExpenseForm({
  isAdding,
  onAdd,
}: {
  isAdding: boolean;
  onAdd: (payload: {
    description: string;
    vendor: string | null;
    frequency: ExpenseFrequency;
    amount: number;
    catalogPlanId: string | null;
    catalogPrice: number | null;
    userPrice: number | null;
  }) => void;
}) {
  const { reportError } = useGlobalError();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<ExpenseFrequency>("monthly");
  const [vendor, setVendor] = useState("");

  return (
    <>
      <div className="form-group">
        <label htmlFor="custom-desc">Description</label>
        <input
          id="custom-desc"
          type="text"
          placeholder="e.g. Gym membership"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="custom-vendor">Provider / Vendor (optional)</label>
        <input
          id="custom-vendor"
          type="text"
          placeholder="e.g. Anytime Fitness"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="custom-amount">Amount</label>
        <input
          id="custom-amount"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Frequency</label>
        <SegmentedPicker
          value={frequency}
          options={EXPENSE_FREQ_OPTIONS}
          onChange={(v) => setFrequency(v as ExpenseFrequency)}
        />
      </div>

      <div className="dashboard-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={isAdding}
          onClick={() => {
            const parsed = Number(amount);
            if (!description.trim()) {
              reportError("Please enter a description.");
              return;
            }
            if (!Number.isFinite(parsed) || parsed < 0) {
              reportError("Please enter a valid amount.");
              return;
            }
            onAdd({
              description: description.trim(),
              vendor: vendor.trim() || null,
              frequency,
              amount: parsed,
              catalogPlanId: null,
              catalogPrice: null,
              userPrice: null,
            });
          }}
        >
          {isAdding ? "Adding…" : "Add to expenses"}
        </button>
      </div>
    </>
  );
}

