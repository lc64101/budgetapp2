"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api/apiClient";
import type {
  AddExpensePayload,
  CatalogPlan,
  ExpenseItem,
  UpdateExpensePayload,
} from "@/services/budget/contracts";

const EXPENSES_KEY = ["expenses"] as const;
const CATALOG_KEY = ["catalog"] as const;

export function useExpenses(userId: string) {
  const queryClient = useQueryClient();
  const apiClient = useMemo(() => new ApiClient(), []);

  const expenses = useQuery<ExpenseItem[], Error>({
    queryKey: [...EXPENSES_KEY, userId],
    enabled: Boolean(userId),
    queryFn: () => apiClient.get<ExpenseItem[]>("/api/budget/expenses"),
  });

  const addExpense = useMutation({
    mutationFn: (payload: AddExpensePayload) =>
      apiClient.post<ExpenseItem>("/api/budget/expenses", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...EXPENSES_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ["planner", userId] });
    },
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateExpensePayload }) =>
      apiClient.patch<void>(`/api/budget/expenses/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...EXPENSES_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ["planner", userId] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/api/budget/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...EXPENSES_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ["planner", userId] });
    },
  });

  return {
    expenses,
    addExpense: addExpense.mutateAsync,
    updateExpense: updateExpense.mutateAsync,
    deleteExpense: deleteExpense.mutateAsync,
    isAddingExpense: addExpense.isPending,
    isUpdatingExpense: updateExpense.isPending,
    isDeletingExpense: deleteExpense.isPending,
  };
}

export function useCatalog(region: string) {
  const apiClient = useMemo(() => new ApiClient(), []);

  return useQuery<CatalogPlan[], Error>({
    queryKey: [...CATALOG_KEY, region],
    queryFn: () => apiClient.get<CatalogPlan[]>(`/api/budget/catalog?region=${encodeURIComponent(region)}`),
    staleTime: 5 * 60 * 1000, // catalog changes infrequently
  });
}
