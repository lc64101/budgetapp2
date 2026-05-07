import {
  type DashboardModuleId,
} from "@/data/repositories/accountRepository";

export type DashboardModuleCategory = "savings" | "investments" | "spending";

export interface DashboardModuleDefinition {
  id: DashboardModuleId;
  title: string;
  category: DashboardModuleCategory;
  description: string;
}

export const DASHBOARD_MODULE_CATALOG: DashboardModuleDefinition[] = [
  {
    id: "savings_total",
    title: "Total Value",
    category: "savings",
    description: "Current savings amount as a quick metric.",
  },
  {
    id: "savings_over_time",
    title: "Graphed Over Time",
    category: "savings",
    description: "Savings progression trend chart.",
  },
  {
    id: "savings_goals",
    title: "Goals",
    category: "savings",
    description: "Savings goals and completion markers.",
  },
  {
    id: "investments_total",
    title: "Total Value",
    category: "investments",
    description: "Current investment amount as a quick metric.",
  },
  {
    id: "investments_over_time",
    title: "Graphed Over Time",
    category: "investments",
    description: "Investment progression trend chart.",
  },
  {
    id: "investments_goals",
    title: "Goals",
    category: "investments",
    description: "Investment targets and checkpoints.",
  },
  {
    id: "spending_total",
    title: "Total Value",
    category: "spending",
    description: "Current spending total for active cycle.",
  },
  {
    id: "spending_over_time",
    title: "Graphed Over Time",
    category: "spending",
    description: "Spending trend chart across cycles.",
  },
  {
    id: "spending_goals",
    title: "Goals",
    category: "spending",
    description: "Spending limits and target alerts.",
  },
];
