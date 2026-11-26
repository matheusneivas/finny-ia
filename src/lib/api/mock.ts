/**
 * API de demonstração em memória. Só é ligada com EXPO_PUBLIC_API_MOCK=true em
 * desenvolvimento, para ver o app no Expo Go sem subir o backend.
 * Não é carregada em builds de produção (ver src/lib/api/setup.ts).
 */
import { monthRange, currentMonth, today, toIsoDate } from '@/utils/dates';

import type { Transport } from './client';
import type {
  Category,
  ChatHistoryItem,
  Goal,
  ProposedAction,
  Transaction,
  TransactionInput,
  User,
} from './types';

const uid = () => Math.random().toString(36).slice(2, 10);

const categories: Category[] = [
  { id: 'c-food', name: 'Alimentação', icon: 'fork.knife', color: '#F59E0B', transactionType: 'EXPENSE' },
  { id: 'c-market', name: 'Mercado', icon: 'cart', color: '#0EA5E9', transactionType: 'EXPENSE' },
  { id: 'c-home', name: 'Moradia', icon: 'house', color: '#6D4AFF', transactionType: 'EXPENSE' },
  { id: 'c-transport', name: 'Transporte', icon: 'car', color: '#14B8A6', transactionType: 'EXPENSE' },
  { id: 'c-fun', name: 'Lazer', icon: 'gamecontroller', color: '#EC4899', transactionType: 'EXPENSE' },
  { id: 'c-health', name: 'Saúde', icon: 'heart', color: '#E5484D', transactionType: 'EXPENSE' },
  { id: 'c-salary', name: 'Salário', icon: 'banknote', color: '#0E9F6E', transactionType: 'INCOME' },
  { id: 'c-extra', name: 'Renda extra', icon: 'sparkles', color: '#22C55E', transactionType: 'INCOME' },
];
const cat = (id: string) => categories.find((c) => c.id === id) ?? categories[0];

const d = (day: number) => {
  const { year, month } = currentMonth();
  return toIsoDate(new Date(year, month, Math.min(day, new Date().getDate())));
};

let user: User | null = null;
let transactions: Transaction[] = [
  { id: uid(), amount: 5200, type: 'INCOME', category: cat('c-salary'), description: 'Salário', transactionDate: d(5) },
  { id: uid(), amount: 1450, type: 'EXPENSE', category: cat('c-home'), description: 'Aluguel', transactionDate: d(6) },
  { id: uid(), amount: 389.9, type: 'EXPENSE', category: cat('c-market'), description: 'Mercado do mês', transactionDate: d(8) },
  { id: uid(), amount: 62.5, type: 'EXPENSE', category: cat('c-food'), description: 'Almoço', transactionDate: d(12) },
  { id: uid(), amount: 120, type: 'EXPENSE', category: cat('c-transport'), description: 'Combustível', transactionDate: d(14) },
  { id: uid(), amount: 89.9, type: 'EXPENSE', category: cat('c-fun'), description: 'Cinema', transactionDate: d(18) },
  { id: uid(), amount: 600, type: 'INCOME', category: cat('c-extra'), description: 'Freela', transactionDate: d(20) },
];
let goals: Goal[] = [
  {
    id: uid(), name: 'Reserva de emergência', targetAmount: 15000, savedAmount: 6200, deadline: `${new Date().getFullYear() + 1}-06-30`,
    icon: 'shield', status: 'ACTIVE', progressPercentage: 41.3,
  },
  {
    id: uid(), name: 'Carro', targetAmount: 40000, savedAmount: 8000, deadline: `${new Date().getFullYear() + 2}-12-31`,
    icon: 'car', status: 'ACTIVE', progressPercentage: 20,
  },
];
const history: ChatHistoryItem[] = [];

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withProgress(g: Goal): Goal {
  const pct = g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0;
  return { ...g, progressPercentage: Math.round(pct * 10) / 10, status: pct >= 100 ? 'COMPLETED' : g.status };
}

function inRange(t: Transaction, start?: string | null, end?: string | null) {
  return (!start || t.transactionDate >= start) && (!end || t.transactionDate <= end);
}

/** IA de mentirinha: entende frases simples para demonstrar o cartão de confirmação. */
function fakeAi(message: string): { reply: string; proposedActions?: ProposedAction[] } {
  const text = message.toLowerCase();
  const amountMatch = text.match(/(\d+(?:[.,]\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;

  if (/meta|juntar|guardar/.test(text) && amount > 0) {
    const name = text.match(/(?:para|pra)\s+(?:um|uma|o|a)?\s*([a-zà-ú\s]+?)(?:\s+até|\s+em|$)/)?.[1]?.trim() || 'Nova meta';
    return {
      reply: `Boa! Preparei uma meta de ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Confira e confirme abaixo.`,
      proposedActions: [{
        id: uid(), type: 'CREATE_GOAL', summary: `Criar meta “${name}”`,
        payload: { name: name.charAt(0).toUpperCase() + name.slice(1), targetAmount: amount, deadline: `${new Date().getFullYear() + 1}-12-31` },
      }],
    };
  }

  if (amount > 0 && /(gastei|paguei|comprei|recebi|ganhei)/.test(text)) {
    const income = /(recebi|ganhei)/.test(text);
    const category = income
      ? cat(/sal[aá]rio/.test(text) ? 'c-salary' : 'c-extra')
      : cat(/mercado|supermercado/.test(text) ? 'c-market' : /uber|gasolina|combust|ônibus|onibus/.test(text) ? 'c-transport' : /aluguel|luz|água|agua|internet/.test(text) ? 'c-home' : /farm[aá]cia|m[eé]dico/.test(text) ? 'c-health' : /cinema|show|jogo|bar/.test(text) ? 'c-fun' : 'c-food');
    const description = message.replace(/^(eu\s+)?(gastei|paguei|comprei|recebi|ganhei)\s*/i, '').replace(/r?\$?\s*\d+([.,]\d{1,2})?\s*(reais)?/i, '').replace(/^\s*(no|na|em|de|com)\s+/i, '').trim();
    const payload: TransactionInput = {
      amount, type: income ? 'INCOME' : 'EXPENSE', categoryId: category.id,
      description: description ? description.charAt(0).toUpperCase() + description.slice(1, 60) : category.name,
      transactionDate: today(),
    };
    return {
      reply: income ? 'Que ótimo! Vou registrar essa entrada, é só confirmar.' : 'Anotado! Confirme o gasto para eu salvar na sua planilha.',
      proposedActions: [{ id: uid(), type: 'CREATE_TRANSACTION', summary: income ? 'Registrar entrada' : 'Registrar gasto', payload }],
    };
  }

  const { startDate, endDate } = monthRange(currentMonth());
  const month = transactions.filter((t) => inRange(t, startDate, endDate));
  const out = month.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const inc = month.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  return {
    reply:
      `Este mês você recebeu ${inc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} e gastou ${out.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. ` +
      'Você pode me contar um gasto (ex.: “gastei 45 no almoço”) ou pedir uma meta (ex.: “quero juntar 5000 para uma viagem”).',
  };
}

export const mockTransport: Transport = async (path, init) => {
  await delay(350);
  // Parse manual: URL/URLSearchParams do React Native não são completos.
  const [pathname, search = ''] = path.split('?');
  const params = new Map(
    search.split('&').filter(Boolean).map((kv) => {
      const [k, v = ''] = kv.split('=');
      return [decodeURIComponent(k), decodeURIComponent(v)] as const;
    }),
  );
  const q = { get: (k: string) => params.get(k) ?? null };
  const method = (init.method ?? 'GET').toUpperCase();
  const body = init.body ? JSON.parse(String(init.body)) : undefined;
  const p = pathname.replace('/api/v1', '');
  const authed = !!(init.headers as Record<string, string> | undefined)?.Authorization;

  const auth = (name: string, email: string) => {
    user = { id: 'u-1', email, name, onboardingCompleted: user?.onboardingCompleted ?? false, plan: 'FREE' };
    return json(200, { accessToken: `mock.${uid()}`, refreshToken: `mock.${uid()}`, tokenType: 'Bearer', user });
  };

  if (p === '/auth/login' && method === 'POST') {
    if (!body?.email || !body?.password) return json(400, { message: 'Informe e-mail e senha.' });
    return auth(user?.name ?? 'Matheus', body.email);
  }
  if (p === '/auth/register' && method === 'POST') return auth(body.fullName, body.email);
  if (p === '/auth/refresh') return user ? auth(user.name, user.email) : json(401);
  if (!authed) return json(401, { message: 'Não autenticado' });
  if (p === '/auth/logout') return json(200, {});

  if (p === '/onboarding/status') return json(200, { currentStep: user?.onboardingCompleted ? 5 : 0, totalSteps: 5, progressPercentage: 0, completed: !!user?.onboardingCompleted });
  if (p.startsWith('/onboarding/step/')) {
    const step = Number(p.split('/').pop());
    if (step === 5 && user) user = { ...user, onboardingCompleted: true };
    return json(200, { currentStep: step, totalSteps: 5, progressPercentage: step * 20, completed: step === 5 });
  }
  if (p === '/users/profile') return json(200, { fullName: user?.name, onboardingCompleted: user?.onboardingCompleted, communicationStyle: 'FRIENDLY', knowledgeLevel: 'BEGINNER' });

  if (p === '/categories') {
    const type = q.get('type');
    return json(200, type ? categories.filter((c) => c.transactionType === type) : categories);
  }

  if (p === '/transactions' && method === 'GET') {
    const list = transactions.filter((t) => inRange(t, q.get('startDate'), q.get('endDate'))).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
    return json(200, { content: list, totalElements: list.length, totalPages: 1, number: 0, size: list.length, last: true });
  }
  if (p === '/transactions' && method === 'POST') {
    const t: Transaction = { id: uid(), ...body, category: cat(body.categoryId), source: 'MANUAL' };
    transactions = [t, ...transactions];
    return json(201, t);
  }
  if (p === '/transactions/summary') {
    const list = transactions.filter((t) => inRange(t, q.get('startDate'), q.get('endDate')));
    const totalIncome = list.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const totalExpense = list.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    return json(200, { startDate: q.get('startDate'), endDate: q.get('endDate'), totalIncome, totalExpense, balance: totalIncome - totalExpense, transactionCount: list.length });
  }
  if (p === '/transactions/by-category') {
    const list = transactions.filter((t) => t.type === 'EXPENSE' && inRange(t, q.get('startDate'), q.get('endDate')));
    const total = list.reduce((s, t) => s + t.amount, 0);
    const map = new Map<string, { c: Category; total: number; n: number }>();
    for (const t of list) {
      const e = map.get(t.category.id) ?? { c: t.category, total: 0, n: 0 };
      e.total += t.amount; e.n += 1; map.set(t.category.id, e);
    }
    const items = [...map.values()].sort((a, b) => b.total - a.total).map((e) => ({
      categoryId: e.c.id, categoryName: e.c.name, categoryIcon: e.c.icon, categoryColor: e.c.color,
      total: e.total, percentage: total ? (e.total / total) * 100 : 0, transactionCount: e.n,
    }));
    return json(200, { startDate: q.get('startDate'), endDate: q.get('endDate'), totalExpense: total, categories: items });
  }
  const txMatch = p.match(/^\/transactions\/([^/]+)$/);
  if (txMatch && method === 'GET') {
    const t = transactions.find((x) => x.id === txMatch[1]);
    return t ? json(200, t) : json(404, { message: 'Lançamento não encontrado' });
  }
  if (txMatch && method === 'DELETE') {
    transactions = transactions.filter((t) => t.id !== txMatch[1]);
    return json(200, { success: true });
  }
  if (txMatch && method === 'PUT') {
    transactions = transactions.map((t) => (t.id === txMatch[1] ? { ...t, ...body, category: cat(body.categoryId) } : t));
    return json(200, transactions.find((t) => t.id === txMatch[1]));
  }

  if (p === '/goals' && method === 'GET') return json(200, goals.map(withProgress));
  if (p === '/goals' && method === 'POST') {
    const g = withProgress({ id: uid(), savedAmount: 0, status: 'ACTIVE', progressPercentage: 0, ...body });
    goals = [...goals, g];
    return json(201, g);
  }
  const goalMatch = p.match(/^\/goals\/([^/]+)(\/contribute)?$/);
  if (goalMatch) {
    const id = goalMatch[1];
    if (goalMatch[2] && method === 'POST') {
      goals = goals.map((g) => (g.id === id ? withProgress({ ...g, savedAmount: g.savedAmount + body.amount }) : g));
      const g = goals.find((x) => x.id === id)!;
      return json(200, { savedAmount: g.savedAmount, progressPercentage: g.progressPercentage });
    }
    if (method === 'DELETE') { goals = goals.filter((g) => g.id !== id); return json(200, { success: true }); }
    if (method === 'PUT') { goals = goals.map((g) => (g.id === id ? withProgress({ ...g, ...body }) : g)); return json(200, goals.find((g) => g.id === id)); }
    return json(200, goals.find((g) => g.id === id));
  }

  if (p === '/chat/messages' && method === 'POST') {
    await delay(700);
    const ai = fakeAi(String(body?.message ?? ''));
    const now = new Date().toISOString();
    history.unshift({ id: uid(), role: 'ASSISTANT', content: ai.reply, createdAt: now, proposedActions: ai.proposedActions }, { id: uid(), role: 'USER', content: body.message, createdAt: now });
    return json(200, { ...ai, tokensUsed: 0 });
  }
  if (p === '/chat/history' && method === 'GET') return json(200, { content: history, totalElements: history.length, totalPages: 1, number: 0, size: 50, last: true });
  if (p === '/chat/history' && method === 'DELETE') { history.length = 0; return json(200, {}); }
  if (p === '/chat/stats') { const used = history.filter((h) => h.role === 'USER').length; return json(200, { plan: 'FREE', messagesUsedThisMonth: used, monthlyLimit: 50, remainingThisMonth: 50 - used }); }

  return json(404, { message: 'Rota não encontrada no modo demonstração' });
};
