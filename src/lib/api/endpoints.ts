import { env } from '@/config/env';

import { api } from './client';
import type {
  AuthResponse,
  Category,
  CategorySummary,
  ChatHistoryItem,
  ChatResponse,
  ChatStats,
  Goal,
  GoalInput,
  GoalProgress,
  OnboardingStepResponse,
  Page,
  Profile,
  Transaction,
  TransactionInput,
  TransactionSummary,
  TransactionType,
} from './types';

const V1 = '/api/v1';

/** A API usa a chave para não criar o mesmo registro duas vezes. */
function idem(key?: string): Record<string, string> | undefined {
  return key && /^[\w-]{1,64}$/.test(key) ? { 'Idempotency-Key': key } : undefined;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>(`${V1}/auth/login`, { email, password }, { auth: false }),
  register: (fullName: string, email: string, password: string) =>
    api.post<AuthResponse>(`${V1}/auth/register`, { fullName, email, password }, { auth: false }),
  logout: (refreshToken: string | null) => api.post<void>(`${V1}/auth/logout`, { refreshToken }),
};

export const transactionsApi = {
  list: (startDate: string, endDate: string, page = 0, size = 100) =>
    api.get<Page<Transaction>>(`${V1}/transactions`, {
      query: { startDate, endDate, page, size, sort: 'transactionDate,desc' },
    }),
  summary: (startDate: string, endDate: string) =>
    api.get<TransactionSummary>(`${V1}/transactions/summary`, { query: { startDate, endDate } }),
  byCategory: (startDate: string, endDate: string) =>
    api.get<CategorySummary>(`${V1}/transactions/by-category`, { query: { startDate, endDate } }),
  get: (id: string) => api.get<Transaction>(`${V1}/transactions/${encodeURIComponent(id)}`),
  create: (input: TransactionInput, idempotencyKey?: string) =>
    api.post<Transaction>(`${V1}/transactions`, input, { headers: idem(idempotencyKey) }),
  update: (id: string, input: TransactionInput) => api.put<Transaction>(`${V1}/transactions/${encodeURIComponent(id)}`, input),
  remove: (id: string) => api.delete<void>(`${V1}/transactions/${encodeURIComponent(id)}`),
};

export const categoriesApi = {
  list: (type?: TransactionType) => api.get<Category[]>(`${V1}/categories`, { query: { type } }),
};

export const goalsApi = {
  list: () => api.get<Goal[]>(`${V1}/goals`),
  get: (id: string) => api.get<Goal>(`${V1}/goals/${encodeURIComponent(id)}`),
  create: (input: GoalInput, idempotencyKey?: string) => api.post<Goal>(`${V1}/goals`, input, { headers: idem(idempotencyKey) }),
  update: (id: string, input: GoalInput) => api.put<Goal>(`${V1}/goals/${encodeURIComponent(id)}`, input),
  remove: (id: string) => api.delete<void>(`${V1}/goals/${encodeURIComponent(id)}`),
  contribute: (id: string, amount: number, idempotencyKey?: string) =>
    api.post<GoalProgress>(`${V1}/goals/${encodeURIComponent(id)}/contribute`, { amount }, { headers: idem(idempotencyKey) }),
};

export const chatApi = {
  send: (message: string) =>
    api.post<ChatResponse>(`${V1}/chat/messages`, { message }, { timeoutMs: env.chatTimeoutMs }),
  history: (page = 0, size = 50) =>
    api.get<Page<ChatHistoryItem>>(`${V1}/chat/history`, { query: { page, size, sort: 'createdAt,desc' } }),
  clearHistory: () => api.delete<void>(`${V1}/chat/history`),
  stats: () => api.get<ChatStats>(`${V1}/chat/stats`),
  /** Marca o cartão como salvo/descartado no servidor (idempotente). */
  setActionStatus: (actionId: string, status: 'CONFIRMED' | 'DISCARDED') =>
    api.put<void>(`${V1}/chat/actions/${encodeURIComponent(actionId)}`, { status }),
};

export const profileApi = {
  get: () => api.get<Profile>(`${V1}/users/profile`),
  update: (input: Partial<Profile>) => api.put<Profile>(`${V1}/users/profile`, input),
};

export const avatarApi = {
  upload: (form: FormData) => api.put<{ avatarUrl: string }>(`${V1}/users/me/avatar`, form, { timeoutMs: 120_000 }),
  remove: () => api.delete<void>(`${V1}/users/me/avatar`),
};

export const onboardingApi = {
  status: () => api.get<OnboardingStepResponse>(`${V1}/onboarding/status`),
  step: (n: 1 | 2 | 3 | 4 | 5, body: Record<string, unknown>) =>
    api.post<OnboardingStepResponse>(`${V1}/onboarding/step/${n}`, body),
};
