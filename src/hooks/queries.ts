import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { categoriesApi, chatApi, goalsApi, profileApi, transactionsApi } from '@/lib/api/endpoints';
import type { GoalInput, TransactionInput, TransactionType } from '@/lib/api/types';
import { monthRange, type MonthRef } from '@/utils/dates';

export const qk = {
  transactions: (m: MonthRef) => ['transactions', m.year, m.month] as const,
  summary: (m: MonthRef) => ['summary', m.year, m.month] as const,
  byCategory: (m: MonthRef) => ['by-category', m.year, m.month] as const,
  categories: (type?: TransactionType) => ['categories', type ?? 'all'] as const,
  goals: ['goals'] as const,
  chatHistory: ['chat-history'] as const,
  chatStats: ['chat-stats'] as const,
  profile: ['profile'] as const,
};

export function useMonthData(month: MonthRef) {
  const { startDate, endDate } = monthRange(month);
  const summary = useQuery({ queryKey: qk.summary(month), queryFn: () => transactionsApi.summary(startDate, endDate) });
  const byCategory = useQuery({ queryKey: qk.byCategory(month), queryFn: () => transactionsApi.byCategory(startDate, endDate) });
  const transactions = useQuery({
    queryKey: qk.transactions(month),
    queryFn: () => transactionsApi.list(startDate, endDate).then((p) => p.content),
  });
  return { summary, byCategory, transactions };
}

export function useCategories(type?: TransactionType) {
  return useQuery({ queryKey: qk.categories(type), queryFn: () => categoriesApi.list(type), staleTime: 10 * 60_000 });
}

export function useGoals() {
  return useQuery({ queryKey: qk.goals, queryFn: goalsApi.list });
}

export function useChatStats() {
  return useQuery({ queryKey: qk.chatStats, queryFn: chatApi.stats, retry: false });
}

export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: profileApi.get });
}

/** Tudo que mexe em dinheiro invalida as visões de planilha. */
function useInvalidateMoney() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['transactions'] }),
      qc.invalidateQueries({ queryKey: ['summary'] }),
      qc.invalidateQueries({ queryKey: ['by-category'] }),
    ]);
}

export function useCreateTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({ mutationFn: (input: TransactionInput) => transactionsApi.create(input), onSuccess: invalidate });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionInput }) => transactionsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({ mutationFn: (id: string) => transactionsApi.remove(id), onSuccess: invalidate });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalInput) => goalsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}

export function useContributeGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) => goalsApi.contribute(goalId, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}
