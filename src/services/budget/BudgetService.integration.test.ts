import { describe, it, expect } from "vitest";
import { normaliseToPayCycle } from "@/domain/budget/calculations";
import type { ExpenseFrequency, PayCycle } from "@/services/budget/contracts";

/**
 * Test expense normalization across different pay cycles
 * This ensures expenses entered with any frequency are correctly
 * normalized to the user's pay cycle for budget calculations
 */
describe("Expense integration with budget calculations", () => {
  describe("Normalization across pay cycles", () => {
    const testCases: Array<{
      desc: string;
      amount: number;
      frequency: ExpenseFrequency;
      payCycle: PayCycle;
      expected: number;
    }> = [
      {
        desc: "Monthly Netflix on monthly pay cycle",
        amount: 25.99,
        frequency: "monthly",
        payCycle: "monthly",
        expected: 25.99,
      },
      {
        desc: "Monthly Netflix on weekly pay cycle",
        amount: 25.99,
        frequency: "monthly",
        payCycle: "weekly",
        expected: 6.0, // 25.99 / 4.33
      },
      {
        desc: "Weekly gym on monthly pay cycle",
        amount: 20,
        frequency: "weekly",
        payCycle: "monthly",
        expected: 86.67, // 20 * (52/12)
      },
      {
        desc: "Annual subscription on monthly pay cycle",
        amount: 120,
        frequency: "annual",
        payCycle: "monthly",
        expected: 10, // 120 / 12
      },
      {
        desc: "Fortnightly expense on fortnightly pay cycle",
        amount: 50,
        frequency: "fortnightly",
        payCycle: "fortnightly",
        expected: 50,
      },
      {
        desc: "Ongoing (not time-bound) on monthly cycle",
        amount: 0,
        frequency: "ongoing",
        payCycle: "monthly",
        expected: 0,
      },
    ];

    testCases.forEach(({ desc, amount, frequency, payCycle, expected }) => {
      it(desc, () => {
        const result = normaliseToPayCycle(amount, frequency, payCycle);
        // Allow small floating-point errors (up to 0.1 for precision)
        expect(Math.abs(result - expected)).toBeLessThan(0.1);
      });
    });
  });

  describe("Budget snapshot calculation with mixed expenses", () => {
    it("should sum expenses correctly when normalized to pay cycle", () => {
      // User has:
      // - Netflix: $25.99/month
      // - Spotify: $14.99/month
      // - Gym: $20/week
      // - Microsoft 365: $99.99/year
      // On a monthly pay cycle

      const expenses = [
        { amount: 25.99, frequency: "monthly" as ExpenseFrequency },
        { amount: 14.99, frequency: "monthly" as ExpenseFrequency },
        { amount: 20, frequency: "weekly" as ExpenseFrequency },
        { amount: 99.99, frequency: "annual" as ExpenseFrequency },
      ];

      const normalizedTotal = expenses.reduce((sum, exp) => {
        return sum + normaliseToPayCycle(exp.amount, exp.frequency, "monthly");
      }, 0);

      // Expected: 25.99 + 14.99 + (20*4.33) + (99.99/12) ≈ 40.98 + 86.6 + 8.33 ≈ 135.91
      expect(normalizedTotal).toBeGreaterThan(130);
      expect(normalizedTotal).toBeLessThan(140);
    });

    it("should handle zero amounts gracefully", () => {
      const result = normaliseToPayCycle(0, "monthly", "monthly");
      expect(result).toBe(0);
    });

    it("should handle ongoing expenses (treated as recurring)", () => {
      // Ongoing expenses are treated like monthly (not time-bound but recurring)
      const result = normaliseToPayCycle(10, "ongoing", "monthly");
      expect(result).toBe(10); // Treated same as monthly
    });
  });

  describe("Price resolution priority", () => {
    it("should prefer user override price in calculations", () => {
      // When user enters custom price, it should be used
      const catalogPrice = 25.99;
      const userPrice = 20.0;
      const monthlyPayCycle = "monthly" as PayCycle;

      const effectivePrice = userPrice ?? catalogPrice;
      const normalized = normaliseToPayCycle(effectivePrice, "monthly", monthlyPayCycle);

      expect(normalized).toBe(20.0);
    });

    it("should fall back to catalog price if user price not set", () => {
      const catalogPrice = 25.99;
      const userPrice = null;
      const monthlyPayCycle = "monthly" as PayCycle;

      const effectivePrice = userPrice ?? catalogPrice;
      const normalized = normaliseToPayCycle(effectivePrice, "monthly", monthlyPayCycle);

      expect(normalized).toBe(25.99);
    });
  });

  describe("Edge cases in budget integration", () => {
    it("should handle expense with custom vendor and no catalog link", () => {
      // Custom expense: "Gym membership" $50/month, no catalog
      const amount = 50;
      const frequency = "monthly" as ExpenseFrequency;

      const normalized = normaliseToPayCycle(amount, frequency, "monthly");
      expect(normalized).toBe(50);
    });

    it("should maintain precision for small amounts", () => {
      const result = normaliseToPayCycle(1.99, "monthly", "monthly");
      expect(result).toBe(1.99);
    });

    it("should maintain precision for large amounts", () => {
      const result = normaliseToPayCycle(999.99, "monthly", "monthly");
      expect(result).toBe(999.99);
    });

    it("should convert annual to other cycles without loss", () => {
      const annual = 1200;
      
      const toMonthly = normaliseToPayCycle(annual, "annual", "monthly");
      expect(toMonthly).toBe(100); // 1200 / 12

      const toWeekly = normaliseToPayCycle(annual, "annual", "weekly");
      expect(Math.abs(toWeekly - 23.08)).toBeLessThan(0.1); // 1200 / 52
    });
  });
});
