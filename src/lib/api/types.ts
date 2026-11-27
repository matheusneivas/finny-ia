/**
 * Tipos espelhando os DTOs da Finny API (Spring Boot).
 * Datas chegam como string ISO (LocalDate = "2026-11-26").
 * Valores monetários chegam como number (BigDecimal serializado).
 */

export type TransactionType = 'INCOME' | 'EXPENSE';
export type ExpenseFrequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type TransactionSource = 'MANUAL' | 'OCR' | 'RECURRENT' | 'IMPORT' | 'AI';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type IncomeRange = 'UNDER_2K' | 'RANGE_2K_5K' | 'RANGE_5K_10K' | 'RANGE_10K_20K' | 'OVER_20K';
export type ExpenseControlPreference = 'MANUAL' | 'AUTOMATIC' | 'MIXED';
export type FinancialKnowledgeLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ReportFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND';
export type CommunicationStyle = 'FORMAL' | 'FRIENDLY' | 'DIRECT';

export interface User {
  id: string;
  email: string;
  name: string;
  /** Caminho relativo da foto na API (ex.: /api/v1/users/me/avatar?v=abc) ou null. */
  avatarUrl?: string | null;
  onboardingCompleted: boolean;
  plan: 'FREE' | 'PREMIUM';
  planExpiresAt?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn?: number;
  user: User;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  isDefault?: boolean;
  transactionType: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description?: string | null;
  transactionDate: string;
  source?: TransactionSource;
  frequency?: ExpenseFrequency | null;
  repeatCount?: number | null;
  notes?: string | null;
  dueDayOfMonth?: number | null;
  recurrenceGroupId?: string | null;
  createdAt?: string;
}

export interface TransactionInput {
  amount: number;
  type: TransactionType;
  categoryId: string;
  description?: string;
  transactionDate: string;
  frequency?: ExpenseFrequency;
  repeatCount?: number;
  notes?: string;
  dueDayOfMonth?: number;
}

export interface TransactionSummary {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface CategorySummaryItem {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface CategorySummary {
  startDate: string;
  endDate: string;
  totalExpense: number;
  categories: CategorySummaryItem[];
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  relatedCategory?: Category | null;
  icon?: string | null;
  status: GoalStatus;
  progressPercentage: number;
  createdAt?: string;
  completedAt?: string | null;
}

export interface GoalInput {
  name: string;
  targetAmount: number;
  deadline: string;
  relatedCategoryId?: string;
  icon?: string;
}

export interface GoalProgress {
  savedAmount: number;
  progressPercentage: number;
  message?: string;
}

/**
 * Ações que a IA propõe. O app NUNCA executa sem confirmação do usuário:
 * mostra um cartão e, ao confirmar, chama os endpoints normais.
 * Contrato combinado com a thread da API (campo novo `proposedActions`).
 */
/** Status guardado pela API (campo novo; pode não vir em versões antigas). */
export type ProposedActionStatus = 'PENDING' | 'CONFIRMED' | 'DISCARDED';

export type ProposedAction = { status?: ProposedActionStatus } & (
  | { id: string; type: 'CREATE_TRANSACTION'; summary?: string; payload: TransactionInput }
  | { id: string; type: 'CREATE_GOAL'; summary?: string; payload: GoalInput }
  | { id: string; type: 'CONTRIBUTE_GOAL'; summary?: string; payload: { goalId: string; amount: number } }
  | { id: string; type: 'UPDATE_TRANSACTION'; summary?: string; payload: TransactionInput & { transactionId: string } }
  | { id: string; type: 'DELETE_TRANSACTION'; summary?: string; payload: { transactionId: string } }
);

export interface ChatResponse {
  reply: string;
  tokensUsed?: number;
  proposedActions?: ProposedAction[];
}

export interface ChatHistoryItem {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  proposedActions?: ProposedAction[];
}

export interface ChatStats {
  plan?: 'FREE' | 'PREMIUM';
  messagesUsedThisMonth: number;
  monthlyLimit: number | null;
  remainingThisMonth?: number | null;
  resetsAt?: string;
}

export interface Profile {
  fullName?: string;
  avatarUrl?: string | null;
  birthDate?: string | null;
  occupation?: string | null;
  incomeRange?: IncomeRange | null;
  paysRent?: boolean | null;
  monthlyRent?: number | null;
  hasDebts?: boolean | null;
  totalDebt?: number | null;
  hasEmergencyFund?: boolean | null;
  emergencyFundMonths?: number | null;
  hasInvestments?: boolean | null;
  monthlyInvestmentGoal?: number | null;
  primaryGoal?: string | null;
  knowledgeLevel?: FinancialKnowledgeLevel | null;
  communicationStyle?: CommunicationStyle | null;
  reportFrequency?: ReportFrequency | null;
  expenseControlPreference?: ExpenseControlPreference | null;
  currentStep?: number;
  onboardingCompleted?: boolean;
}

export interface OnboardingStepResponse {
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
  completed: boolean;
  nextStepDescription?: string;
  profile?: Profile;
}

export interface ApiErrorBody {
  status?: number;
  error?: string;
  message?: string;
  /** Ex.: EMAIL_NOT_VERIFIED (403). */
  code?: string;
  errors?: Record<string, string>;
}
