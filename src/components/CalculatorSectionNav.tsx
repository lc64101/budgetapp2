"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type CalculatorMode = "income" | "expenses";

interface CalculatorSectionNavProps {
  mode?: CalculatorMode;
  onModeChange?: (mode: CalculatorMode) => void;
}

export function CalculatorSectionNav({ mode, onModeChange }: CalculatorSectionNavProps = {}) {
  const isControlled = Boolean(mode && onModeChange);
  const pathname = usePathname();
  const router = useRouter();
  const isIncome = isControlled ? mode === "income" : pathname === "/calculator/income";
  const isExpenses = isControlled ? mode === "expenses" : pathname === "/calculator/expenses";

  useEffect(() => {
    if (isControlled) {
      return;
    }

    router.prefetch("/calculator/income");
    router.prefetch("/calculator/expenses");
  }, [isControlled, router]);

  return (
    <nav className="calc-nav" aria-label="Calculator Sections">
      {isControlled ? (
        <>
          <button
            type="button"
            className={`calc-nav-link${isIncome ? " active" : ""}`}
            onClick={() => onModeChange?.("income")}
          >
            Income
          </button>
          <button
            type="button"
            className={`calc-nav-link${isExpenses ? " active" : ""}`}
            onClick={() => onModeChange?.("expenses")}
          >
            Expenses
          </button>
        </>
      ) : (
        <>
          <Link href="/calculator/income" prefetch className={`calc-nav-link${isIncome ? " active" : ""}`}>
            Income
          </Link>
          <Link href="/calculator/expenses" prefetch className={`calc-nav-link${isExpenses ? " active" : ""}`}>
            Expenses
          </Link>
        </>
      )}
    </nav>
  );
}
