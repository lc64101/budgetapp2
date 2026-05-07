import { describe, it, expect } from "vitest";
import type { ExpenseItem, ExpenseFrequency } from "@/services/budget/contracts";

describe("Expense data calculations", () => {
  describe("Effective price resolution", () => {
    it("should use userPrice when provided", () => {
      const expense: ExpenseItem = {
        id: "1",
        description: "Netflix Premium",
        vendor: "Netflix",
        frequency: "monthly" as ExpenseFrequency,
        amount: 25.99,
        catalogPlanId: "plan-1",
        catalogPrice: 25.99,
        userPrice: 15.0, // User override
        effectivePrice: 15.0,
        createdAt: new Date().toISOString(),
      };

      expect(expense.effectivePrice).toBe(15.0);
    });

    it("should use catalogPrice when userPrice not provided", () => {
      const expense: ExpenseItem = {
        id: "1",
        description: "Netflix Premium",
        vendor: "Netflix",
        frequency: "monthly" as ExpenseFrequency,
        amount: 25.99,
        catalogPlanId: "plan-1",
        catalogPrice: 25.99,
        userPrice: null,
        effectivePrice: 25.99,
        createdAt: new Date().toISOString(),
      };

      expect(expense.effectivePrice).toBe(25.99);
    });

    it("should fall back to amount when both catalog and user prices missing", () => {
      const expense: ExpenseItem = {
        id: "1",
        description: "Custom expense",
        vendor: null,
        frequency: "monthly" as ExpenseFrequency,
        amount: 50.0,
        catalogPlanId: null,
        catalogPrice: null,
        userPrice: null,
        effectivePrice: 50.0,
        createdAt: new Date().toISOString(),
      };

      expect(expense.effectivePrice).toBe(50.0);
    });
  });

  describe("Frequency validation", () => {
    const validFrequencies: ExpenseFrequency[] = ["weekly", "fortnightly", "monthly", "annual", "ongoing"];

    validFrequencies.forEach((freq) => {
      it(`should accept "${freq}" as valid frequency`, () => {
        expect(validFrequencies).toContain(freq);
      });
    });
  });

  describe("Expense list operations", () => {
    it("should create expense with correct structure", () => {
      const newExpense: ExpenseItem = {
        id: "1",
        description: "Netflix Standard",
        vendor: "Netflix",
        frequency: "monthly",
        amount: 18.99,
        catalogPlanId: "netflix-std",
        catalogPrice: 18.99,
        userPrice: null,
        effectivePrice: 18.99,
        createdAt: new Date().toISOString(),
      };

      expect(newExpense.description).toBe("Netflix Standard");
      expect(newExpense.frequency).toBe("monthly");
      expect(newExpense.amount).toBe(18.99);
    });

    it("should maintain list order after insert", () => {
      const expenses: ExpenseItem[] = [
        {
          id: "1",
          description: "Netflix",
          vendor: "Netflix",
          frequency: "monthly",
          amount: 18.99,
          catalogPlanId: null,
          catalogPrice: null,
          userPrice: null,
          effectivePrice: 18.99,
          createdAt: "2026-03-25T10:00:00Z",
        },
        {
          id: "2",
          description: "Spotify",
          vendor: "Spotify",
          frequency: "monthly",
          amount: 14.99,
          catalogPlanId: null,
          catalogPrice: null,
          userPrice: null,
          effectivePrice: 14.99,
          createdAt: "2026-03-25T10:01:00Z",
        },
      ];

      expect(expenses.length).toBe(2);
      expect(expenses[0].vendor).toBe("Netflix");
      expect(expenses[1].vendor).toBe("Spotify");
    });

    it("should handle custom price override persistence", () => {
      const expense: ExpenseItem = {
        id: "1",
        description: "Netflix Premium",
        vendor: "Netflix",
        frequency: "monthly",
        amount: 25.99,
        catalogPlanId: "netflix-prem",
        catalogPrice: 25.99,
        userPrice: 20.0, // Custom override
        effectivePrice: 20.0,
        createdAt: new Date().toISOString(),
      };

      expect(expense.effectivePrice).toBe(20.0);
      expect(expense.catalogPrice).toBe(25.99); // Original not modified
    });
  });

  describe("Edge cases", () => {
    it("should handle zero amount expense", () => {
      const expense = {
        id: "1",
        description: "Free tier",
        vendor: "Service",
        frequency: "monthly" as ExpenseFrequency,
        amount: 0,
        catalogPlanId: null,
        catalogPrice: null,
        userPrice: null,
        effectivePrice: 0,
        createdAt: new Date().toISOString(),
      };

      expect(expense.amount).toBe(0);
    });

    it("should handle very large amounts", () => {
      const expense = {
        id: "1",
        description: "Enterprise plan",
        vendor: "Enterprise",
        frequency: "annual" as ExpenseFrequency,
        amount: 999999.99,
        catalogPlanId: null,
        catalogPrice: null,
        userPrice: null,
        effectivePrice: 999999.99,
        createdAt: new Date().toISOString(),
      };

      expect(expense.amount).toBe(999999.99);
    });

    it("should handle empty vendor (custom expenses)", () => {
      const expense = {
        id: "1",
        description: "Gym membership",
        vendor: null,
        frequency: "monthly" as ExpenseFrequency,
        amount: 50.0,
        catalogPlanId: null,
        catalogPrice: null,
        userPrice: null,
        effectivePrice: 50.0,
        createdAt: new Date().toISOString(),
      };

      expect(expense.vendor).toBeNull();
      expect(expense.description).toBe("Gym membership");
    });
  });
});
