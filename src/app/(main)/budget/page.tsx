"use client";

import { useMemo, useState } from "react";
import { useCurrentUser } from "@/features/account/useCurrentUser";
import {
  usePlannerData,
  type AllocationMode,
  type AllocationModeDrafts,
  type AllocationPlan,
} from "@/features/budget/usePlannerData";
import { applyAllocationChange, type AllocationField } from "@/domain/budget/allocations";

function pctToAmount(pct: number, available: number): number {
  return Number(((Math.max(0, available) * pct) / 100).toFixed(2));
}

function amountToPct(amount: number, available: number): number {
  if (available <= 0) {
    return 0;
  }

  return Number(((Math.max(0, amount) / available) * 100).toFixed(2));
}

function normalizePercentages(values: AllocationPlan): AllocationPlan {
  const spending = Number(Math.max(0, values.spendingPct).toFixed(2));
  const saving = Number(Math.max(0, values.savingPct).toFixed(2));
  const investing = Number(Math.max(0, values.investingPct).toFixed(2));

  return { spendingPct: spending, savingPct: saving, investingPct: investing };
}

function plansEqual(a: AllocationPlan, b: AllocationPlan): boolean {
  return (
    Math.abs(a.spendingPct - b.spendingPct) < 0.001 &&
    Math.abs(a.savingPct - b.savingPct) < 0.001 &&
    Math.abs(a.investingPct - b.investingPct) < 0.001
  );
}

function valuesEqual(
  a: AllocationModeDrafts["value"],
  b: AllocationModeDrafts["value"],
): boolean {
  return (
    Math.abs(a.spendingAmount - b.spendingAmount) < 0.01 &&
    Math.abs(a.savingAmount - b.savingAmount) < 0.01 &&
    Math.abs(a.investingAmount - b.investingAmount) < 0.01
  );
}

function percentagesFromValue(
  value: AllocationModeDrafts["value"],
  available: number,
): AllocationPlan {
  return normalizePercentages({
    spendingPct: amountToPct(value.spendingAmount, available),
    savingPct: amountToPct(value.savingAmount, available),
    investingPct: amountToPct(value.investingAmount, available),
  });
}

function valueFromPercentages(
  percentages: AllocationPlan,
  available: number,
): AllocationModeDrafts["value"] {
  return {
    spendingAmount: pctToAmount(percentages.spendingPct, available),
    savingAmount: pctToAmount(percentages.savingPct, available),
    investingAmount: pctToAmount(percentages.investingPct, available),
  };
}

export default function BudgetPage() {
  const { userId, isLoading: isLoadingUser } = useCurrentUser();
  const { planner, saveAllocations, isSavingAllocations, clientInitError } = usePlannerData(userId ?? "");

  if (clientInitError) {
    return <div className="app-loading">{clientInitError}</div>;
  }

  if (isLoadingUser || planner.isLoading) {
    return <div className="app-loading">Loading budget planner...</div>;
  }

  if (!userId || planner.error || !planner.data) {
    return <div className="app-loading">Unable to load budget planner.</div>;
  }

  return (
    <BudgetForm
      key={`${planner.data.activeAllocationMode}-${planner.data.allocations.spendingPct}-${planner.data.allocations.savingPct}-${planner.data.allocations.investingPct}-${planner.data.available}`}
      initialActiveMode={planner.data.activeAllocationMode}
      initialDrafts={planner.data.allocationModeDrafts}
      available={planner.data.available}
      calculator={planner.data.calculator}
      saveAllocations={saveAllocations}
      isSavingAllocations={isSavingAllocations}
    />
  );
}

function BudgetForm({
  initialActiveMode,
  initialDrafts,
  available: rawAvailable,
  calculator,
  saveAllocations,
  isSavingAllocations,
}: {
  initialActiveMode: AllocationMode;
  initialDrafts: AllocationModeDrafts;
  available: number;
  calculator: {
    payCycle: "weekly" | "fortnightly" | "monthly";
    income: number;
    fixedExpenses: number;
    variableExpenses: number;
  };
  saveAllocations: (input: {
    allocations: AllocationPlan;
    activeMode: AllocationMode;
    modeDrafts: AllocationModeDrafts;
  }) => Promise<void>;
  isSavingAllocations: boolean;
}) {
  const available = Math.max(0, rawAvailable);
  const [activeMode, setActiveMode] = useState<AllocationMode>(
    initialActiveMode === "percent" ? "slider" : initialActiveMode,
  );
  const [lastMode, setLastMode] = useState<AllocationMode | null>(null);
  const [matchPreview, setMatchPreview] = useState<{
    sourceMode: AllocationMode;
    targetMode: AllocationMode;
    previewText: string;
    percentages: AllocationPlan;
    valueDraft: AllocationModeDrafts["value"];
  } | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<AllocationModeDrafts>(initialDrafts);
  const [drafts, setDrafts] = useState<AllocationModeDrafts>(initialDrafts);

  const activePercentages =
    activeMode === "value"
      ? percentagesFromValue(drafts.value, available)
      : normalizePercentages(drafts[activeMode]);
  const totalPct = activePercentages.spendingPct + activePercentages.savingPct + activePercentages.investingPct;
  const spendingAmount =
    activeMode === "value" ? drafts.value.spendingAmount : pctToAmount(activePercentages.spendingPct, available);
  const savingAmount =
    activeMode === "value" ? drafts.value.savingAmount : pctToAmount(activePercentages.savingPct, available);
  const investingAmount =
    activeMode === "value" ? drafts.value.investingAmount : pctToAmount(activePercentages.investingPct, available);

  const activeIsDirty =
    activeMode === "value"
      ? !valuesEqual(drafts.value, savedDrafts.value)
      : !plansEqual(normalizePercentages(drafts[activeMode]), normalizePercentages(savedDrafts[activeMode]));

  const unallocatedPct = Number((100 - totalPct).toFixed(2));
  const unallocatedAmount = Number(
    (
      activeMode === "value"
        ? available - (drafts.value.spendingAmount + drafts.value.savingAmount + drafts.value.investingAmount)
        : (available * unallocatedPct) / 100
    ).toFixed(2),
  );
  const canSave =
    activeMode === "value"
      ? Math.abs(unallocatedAmount) < 0.01
      : Math.abs(unallocatedPct) < 0.001;

  const applyPercentChange = (field: AllocationField, nextValue: number) => {
    setDrafts((current) => ({
      ...current,
      [activeMode]: applyAllocationChange(current[activeMode as "slider" | "percent"], field, nextValue),
    }));
  };

  const applyValueChange = (
    field: keyof AllocationModeDrafts["value"],
    nextValue: number,
  ) => {
    setDrafts((current) => {
      const valueDraft = { ...current.value };
      valueDraft[field] = Math.max(0, Number(nextValue.toFixed(2)));

      const total = valueDraft.spendingAmount + valueDraft.savingAmount + valueDraft.investingAmount;
      const overflow = total - available;

      if (overflow > 0) {
        if (field !== "spendingAmount") {
          const spendingCut = Math.min(valueDraft.spendingAmount, overflow);
          valueDraft.spendingAmount = Number((valueDraft.spendingAmount - spendingCut).toFixed(2));
          let remaining = Number((overflow - spendingCut).toFixed(2));
          if (remaining > 0) {
            const otherField = field === "savingAmount" ? "investingAmount" : "savingAmount";
            const otherCut = Math.min(valueDraft[otherField], remaining);
            valueDraft[otherField] = Number((valueDraft[otherField] - otherCut).toFixed(2));
            remaining = Number((remaining - otherCut).toFixed(2));
            if (remaining > 0) {
              valueDraft[field] = Number((Math.max(0, valueDraft[field] - remaining)).toFixed(2));
            }
          }
        } else {
          const investingCut = Math.min(valueDraft.investingAmount, overflow);
          valueDraft.investingAmount = Number((valueDraft.investingAmount - investingCut).toFixed(2));
          let remaining = Number((overflow - investingCut).toFixed(2));
          if (remaining > 0) {
            const savingCut = Math.min(valueDraft.savingAmount, remaining);
            valueDraft.savingAmount = Number((valueDraft.savingAmount - savingCut).toFixed(2));
            remaining = Number((remaining - savingCut).toFixed(2));
            if (remaining > 0) {
              valueDraft.spendingAmount = Number((Math.max(0, valueDraft.spendingAmount - remaining)).toFixed(2));
            }
          }
        }
      }

      return {
        ...current,
        value: valueDraft,
      };
    });
  };

  const switchMode = (mode: AllocationMode) => {
    if (mode === activeMode) {
      return;
    }

    setLastMode(activeMode);
    setActiveMode(mode);
    setMatchPreview(null);
  };

  const applyModeMatch = () => {
    if (!lastMode || lastMode === activeMode) {
      return;
    }

    const sourceAsPercentages =
      lastMode === "value"
        ? percentagesFromValue(drafts.value, available)
        : normalizePercentages(drafts[lastMode]);

    const preview =
      activeMode === "value"
        ? valueFromPercentages(sourceAsPercentages, available)
        : sourceAsPercentages;

    let previewText = "";
    if (activeMode === "value") {
      const previewValue = preview as AllocationModeDrafts["value"];
      previewText = `Spending $${previewValue.spendingAmount.toFixed(2)}, Saving $${previewValue.savingAmount.toFixed(2)}, Investing $${previewValue.investingAmount.toFixed(2)}`;
    } else {
      const previewPercent = preview as AllocationPlan;
      previewText = `Spending ${previewPercent.spendingPct.toFixed(0)}%, Saving ${previewPercent.savingPct.toFixed(0)}%, Investing ${previewPercent.investingPct.toFixed(0)}%`;
    }

    setMatchPreview({
      sourceMode: lastMode,
      targetMode: activeMode,
      previewText,
      percentages: sourceAsPercentages,
      valueDraft: valueFromPercentages(sourceAsPercentages, available),
    });
  };

  const confirmModeMatch = () => {
    if (!matchPreview) {
      return;
    }

    setDrafts((current) => {
      if (matchPreview.targetMode === "value") {
        return {
          ...current,
          value: matchPreview.valueDraft,
        };
      }

      return {
        ...current,
        [matchPreview.targetMode]: matchPreview.percentages,
      };
    });

    setMatchPreview(null);
  };

  const revertActiveMode = () => {
    setDrafts((current) => ({
      ...current,
      [activeMode]: savedDrafts[activeMode],
    }));
  };

  const saveActiveMode = async () => {
    await saveAllocations({
      allocations: normalizePercentages(activePercentages),
      activeMode,
      modeDrafts: drafts,
    });

    setSavedDrafts(drafts);
  };

  const cycleLabel = useMemo(() => {
    if (calculator.payCycle === "weekly") {
      return "Weekly";
    }
    if (calculator.payCycle === "fortnightly") {
      return "Fortnightly";
    }
    return "Monthly";
  }, [calculator.payCycle]);

  return (
    <section className="page">
      <div className="page-header">
        <h1>Budget</h1>
        <p className="muted">Step 3: split post-expense cashflow across spending, saving, and investing.</p>
      </div>

      <div className="grid">
        <article className="card stat-card">
          <span className="stat-label">Available After Expenses ({cycleLabel})</span>
          <span className="stat-value">${available.toFixed(2)}</span>
          <span className="stat-helper">Income ${calculator.income.toFixed(2)} - Expenses ${(calculator.fixedExpenses + calculator.variableExpenses).toFixed(2)}</span>
        </article>

        <article className="card stat-card">
          <span className="stat-label">Allocation Total</span>
          <span className="stat-value">{totalPct.toFixed(0)}%</span>
          <span className="stat-helper">
            {canSave
              ? "Balanced at exactly 100%."
              : `Unallocated: ${Math.max(0, unallocatedPct).toFixed(2)}% (${Math.max(0, unallocatedAmount).toFixed(2)}).`}
          </span>
        </article>
      </div>

      <article className="card calc-card">
        <div className="allocation-planner-header">
          <h2 className="calc-section-title">Allocation Planner</h2>
          <div className="allocation-mode-toggle" role="group" aria-label="Allocation input mode">
            <button
              type="button"
              className={`allocation-mode-btn${activeMode === "slider" ? " active" : ""}`}
              onClick={() => switchMode("slider")}
            >
              Sliders
            </button>
            <button
              type="button"
              className={`allocation-mode-btn${activeMode === "value" ? " active" : ""}`}
              onClick={() => switchMode("value")}
            >
              $$$
            </button>
          </div>
        </div>
        <p className="muted">Choose proportions of available cashflow for this cycle.</p>

        {activeMode === "slider" && !canSave ? (
          <div className="allocation-warning" role="alert">
            Unallocated funds warning: {Math.max(0, unallocatedPct).toFixed(2)}% (${Math.max(0, unallocatedAmount).toFixed(2)}) is not assigned yet.
          </div>
        ) : null}

        {lastMode && lastMode !== activeMode ? (
          <div className="dashboard-actions allocation-mode-actions">
            <button type="button" className="btn" onClick={applyModeMatch}>
              Match from previous selected
            </button>
          </div>
        ) : null}

        {matchPreview ? (
          <div className="allocation-match-preview" role="status" aria-live="polite">
            <p className="muted">
              Match {matchPreview.targetMode} from {matchPreview.sourceMode}: {matchPreview.previewText}
            </p>
            <div className="dashboard-actions allocation-mode-actions">
              <button type="button" className="btn" onClick={() => setMatchPreview(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmModeMatch}>
                Confirm Match
              </button>
            </div>
          </div>
        ) : null}

        {activeMode === "slider" ? (
          <div className="allocation-slider-list">
            <div className="allocation-slider-item">
              <div className="allocation-slider-row">
                <label htmlFor="spending-slider">Spending</label>
                <span className="chip">{drafts.slider.spendingPct.toFixed(0)}%</span>
              </div>
              <input
                id="spending-slider"
                className="allocation-slider"
                type="range"
                min={0}
                max={100}
                step={1}
                value={drafts.slider.spendingPct}
                onChange={(event) => applyPercentChange("spendingPct", Number(event.target.value) || 0)}
              />
              <p className="muted allocation-slider-amount">${pctToAmount(drafts.slider.spendingPct, available).toFixed(2)}</p>
            </div>

            <div className="allocation-slider-item">
              <div className="allocation-slider-row">
                <label htmlFor="saving-slider">Saving</label>
                <span className="chip">{drafts.slider.savingPct.toFixed(0)}%</span>
              </div>
              <input
                id="saving-slider"
                className="allocation-slider"
                type="range"
                min={0}
                max={100}
                step={1}
                value={drafts.slider.savingPct}
                onChange={(event) => applyPercentChange("savingPct", Number(event.target.value) || 0)}
              />
              <p className="muted allocation-slider-amount">${pctToAmount(drafts.slider.savingPct, available).toFixed(2)}</p>
            </div>

            <div className="allocation-slider-item">
              <div className="allocation-slider-row">
                <label htmlFor="investing-slider">Investing</label>
                <span className="chip">{drafts.slider.investingPct.toFixed(0)}%</span>
              </div>
              <input
                id="investing-slider"
                className="allocation-slider"
                type="range"
                min={0}
                max={100}
                step={1}
                value={drafts.slider.investingPct}
                onChange={(event) => applyPercentChange("investingPct", Number(event.target.value) || 0)}
              />
              <p className="muted allocation-slider-amount">${pctToAmount(drafts.slider.investingPct, available).toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="spending-value">Spending ($)</label>
              <input
                id="spending-value"
                type="number"
                inputMode="decimal"
                min={0}
                value={drafts.value.spendingAmount}
                onChange={(event) => applyValueChange("spendingAmount", Number(event.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="saving-value">Saving ($)</label>
              <input
                id="saving-value"
                type="number"
                inputMode="decimal"
                min={0}
                value={drafts.value.savingAmount}
                onChange={(event) => applyValueChange("savingAmount", Number(event.target.value) || 0)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="investing-value">Investing ($)</label>
              <input
                id="investing-value"
                type="number"
                inputMode="decimal"
                min={0}
                value={drafts.value.investingAmount}
                onChange={(event) => applyValueChange("investingAmount", Number(event.target.value) || 0)}
              />
            </div>

            {!canSave ? (
              <div className="allocation-warning" role="alert">
                ${Math.max(0, unallocatedAmount).toFixed(2)} is unallocated in this cycle.
              </div>
            ) : null}
          </>
        )}

        {activeIsDirty ? (
          <div className="dashboard-actions allocation-action-row">
            <button type="button" className="btn" disabled={isSavingAllocations} onClick={revertActiveMode}>
              Revert
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canSave || isSavingAllocations}
              onClick={saveActiveMode}
            >
              {isSavingAllocations ? "Saving..." : "Save Allocation Plan"}
            </button>
          </div>
        ) : null}
      </article>

      <article className="card list-card">
        <h2 className="calc-section-title">Resulting Buckets</h2>
        <div className="list-item">
          <div>
            <span className="list-title">Spending Bucket</span>
            <span className="list-subtle">Flexible day-to-day purchases and lifestyle costs.</span>
          </div>
          <span className="chip">${spendingAmount.toFixed(2)}</span>
        </div>
        <div className="list-item">
          <div>
            <span className="list-title">Saving Bucket</span>
            <span className="list-subtle">Emergency fund and near-term goals.</span>
          </div>
          <span className="chip">${savingAmount.toFixed(2)}</span>
        </div>
        <div className="list-item">
          <div>
            <span className="list-title">Investing Bucket</span>
            <span className="list-subtle">Long-term growth and wealth building.</span>
          </div>
          <span className="chip">${investingAmount.toFixed(2)}</span>
        </div>
      </article>
    </section>
  );
}
