"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api/apiClient";
import type {
  AddPayEntryPayload,
  AllocationMode,
  AllocationModeDrafts,
  AllocationPlan,
  CalculatorSnapshot,
  PayCycle,
  PayEntry,
  PlannerSnapshot,
} from "@/services/budget/contracts";

export type {
  PayCycle,
  CalculatorSnapshot,
  AllocationPlan,
  AllocationMode,
  AllocationModeDrafts,
  PlannerSnapshot,
  PayEntry,
};

export function usePlannerData(userId: string) {
  const queryClient = useQueryClient();
  const apiClient = useMemo(() => new ApiClient(), []);

  const planner = useQuery<PlannerSnapshot, Error>({
    queryKey: ["planner", userId],
    enabled: Boolean(userId),
    queryFn: () => apiClient.get<PlannerSnapshot>("/api/budget/planner"),
  });

  const saveCalculator = useMutation({
    mutationFn: async (calculator: CalculatorSnapshot) => {
      await apiClient.post<void>("/api/budget/planner", calculator);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", userId] });
      queryClient.invalidateQueries({ queryKey: ["social", "leaderboard", userId] });
    },
  });

  const saveAllocations = useMutation({
    mutationFn: async (input: {
      allocations: AllocationPlan;
      activeMode: AllocationMode;
      modeDrafts: AllocationModeDrafts;
    }) => {
      await apiClient.put<void>("/api/budget/allocations", input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner", userId] });
    },
  });

  const payEntries = useQuery<PayEntry[], Error>({
    queryKey: ["pay-entries", userId],
    enabled: Boolean(userId),
    queryFn: () => apiClient.get<PayEntry[]>("/api/budget/pay-entries"),
  });

  const addPayEntry = useMutation({
    mutationFn: async (input: { payCycle: PayCycle; paymentDate: string; amount: number }) => {
      const payload: AddPayEntryPayload = {
        payCycle: input.payCycle,
        paymentDate: input.paymentDate,
        amount: input.amount,
      };
      await apiClient.post<void>("/api/budget/pay-entries", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pay-entries", userId] });
    },
  });

  return {
    planner,
    saveCalculator: saveCalculator.mutateAsync,
    saveAllocations: saveAllocations.mutateAsync,
    payEntries,
    addPayEntry: addPayEntry.mutateAsync,
    isSavingCalculator: saveCalculator.isPending,
    isSavingAllocations: saveAllocations.isPending,
    isSavingPayEntry: addPayEntry.isPending,
    clientInitError: null,
  };
}
