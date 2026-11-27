/**
 * API de demonstração em memória. Só é ligada com EXPO_PUBLIC_API_MOCK=true em
 * desenvolvimento, para ver o app no Expo Go sem subir o backend.
 * Não é carregada em builds de produção (ver src/lib/api/setup.ts).
 */
import { currentMonth, monthRange, toIsoDate, today, yesterday } from '@/utils/dates';

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
const idemTx = new Map<string, string>();

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

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const has = (t: string, re: RegExp) => re.test(t);

function monthStats() {
  const { startDate, endDate } = monthRange(currentMonth());
  const month = transactions.filter((t) => inRange(t, startDate, endDate));
  const expenses = month.filter((t) => t.type === 'EXPENSE');
  const income = month.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const spent = expenses.reduce((s, t) => s + t.amount, 0);
  const byCat = new Map<string, number>();
  for (const t of expenses) byCat.set(t.category.name, (byCat.get(t.category.name) ?? 0) + t.amount);
  const ranking = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
  const biggest = [...expenses].sort((a, b) => b.amount - a.amount)[0];
  return { income, spent, balance: income - spent, ranking, biggest, count: month.length };
}

/** Lê "R$ 1.234,56", "45", "45,90", "2 mil", "1.5k" como número. */
function parseAmount(text: string): number {
  const mil = text.match(/(\d+(?:[.,]\d+)?)\s*(mil|k)\b/);
  if (mil) return parseFloat(mil[1].replace(',', '.')) * 1000;
  const m = text.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)/);
  if (!m) return 0;
  const raw = m[1];
  const value = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : /\.\d{3}$/.test(raw) ? raw.replace(/\./g, '') : raw;
  return parseFloat(value) || 0;
}

const categoryRules: [RegExp, string][] = [
  [/mercado|supermercado|feira|hortifruti|padaria/, 'c-market'],
  [/uber|99|gasolina|combust|onibus|metro|estacionamento|pedagio|taxi/, 'c-transport'],
  [/aluguel|luz|energia|agua|internet|condominio|gas\b|iptu/, 'c-home'],
  [/farmacia|remedio|medico|consulta|exame|dentista|academia/, 'c-health'],
  [/cinema|show|jogo|bar|festa|netflix|spotify|streaming|viagem|passeio/, 'c-fun'],
  [/almoco|jantar|lanche|cafe|restaurante|ifood|pizza|comida|hamburguer/, 'c-food'],
];

/**
 * "IA" de demonstração: entende frases comuns de finanças pessoais para o app
 * poder ser testado sem backend. A IA de verdade (Claude) roda na API.
 */
function fakeAi(message: string): { reply: string; proposedActions?: ProposedAction[] } {
  const text = norm(message.trim());
  const amount = parseAmount(text);
  const st = monthStats();

  // Registrar entrada ou gasto
  if (amount > 0 && has(text, /(gastei|paguei|comprei|torrei|recebi|ganhei|entrou|caiu)/)) {
    const income = has(text, /(recebi|ganhei|entrou|caiu)/);
    const categoryId = income
      ? has(text, /salario|pagamento do trabalho/) ? 'c-salary' : 'c-extra'
      : categoryRules.find(([re]) => re.test(text))?.[1] ?? 'c-food';
    const category = cat(categoryId);
    const description = message
      .replace(/^(eu\s+)?(gastei|paguei|comprei|torrei|recebi|ganhei|entrou|caiu)\s*/i, '')
      .replace(/r?\$?\s*\d[\d.,]*\s*(reais|mil|k)?/i, '')
      .replace(/^\s*(no|na|em|de|com|do|da|um|uma)\s+/i, '')
      .trim();
    const payload: TransactionInput = {
      amount, type: income ? 'INCOME' : 'EXPENSE', categoryId: category.id,
      description: description ? description.charAt(0).toUpperCase() + description.slice(1, 60) : category.name,
      transactionDate: has(text, /ontem/) ? yesterday() : today(),
    };
    const after = income ? st.balance + amount : st.balance - amount;
    return {
      reply: income
        ? `Boa! Separei uma entrada de ${brl(amount)} em ${category.name}. Com ela, seu saldo do mês vai para ${brl(after)}. Confirma?`
        : `Anotei ${brl(amount)} em ${category.name}. Depois disso, sobram ${brl(after)} no mês. Confirma para eu salvar?`,
      proposedActions: [{ id: uid(), type: 'CREATE_TRANSACTION', summary: income ? 'Registrar entrada' : 'Registrar gasto', payload }],
    };
  }

  // Criar meta
  if (amount > 0 && has(text, /(meta|juntar|guardar|economizar|poupar|comprar um|comprar uma)/)) {
    const raw = text.match(/(?:para|pra)\s+(?:um|uma|o|a|minha|meu)?\s*([a-z\s]+?)(?:\s+(?:ate|em|no|daqui)\b|$)/)?.[1]?.trim();
    const name = raw ? raw.charAt(0).toUpperCase() + raw.slice(1, 40) : 'Nova meta';
    const months = Number(text.match(/(\d+)\s*mes/)?.[1]) || 12;
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + months);
    const perMonth = amount / months;
    const share = st.income > 0 ? Math.round((perMonth / st.income) * 100) : null;
    return {
      reply:
        `Montei a meta “${name}” de ${brl(amount)} em ${months} meses: dá ${brl(perMonth)} por mês` +
        (share != null ? `, cerca de ${share}% da sua renda deste mês.` : '.') +
        (share != null && share > 30 ? ' É um valor alto; se apertar, posso esticar o prazo.' : ' Cabe bem no seu orçamento.'),
      proposedActions: [{ id: uid(), type: 'CREATE_GOAL', summary: `Criar meta “${name}”`, payload: { name, targetAmount: amount, deadline: toIsoDate(deadline) } }],
    };
  }

  // Investimentos e ações: não recomendamos ativos específicos
  if (has(text, /(acao|acoes|bolsa|investir|investimento|cripto|bitcoin|tesouro|cdb|renda fixa|fii)/)) {
    const reserve = goals.find((g) => /reserva/i.test(g.name));
    return {
      reply:
        'Não indico ações ou ativos específicos: isso depende do seu perfil e pede um profissional certificado. ' +
        'O que posso dizer é a ordem que costuma funcionar: 1) reserva de emergência de 6 meses de gastos em algo com liquidez diária (Tesouro Selic ou CDB 100% do CDI); 2) só depois, investimentos de longo prazo diversificados. ' +
        (reserve ? `Sua reserva está em ${Math.round(withProgress(reserve).progressPercentage)}%, então eu focaria nela primeiro.` : 'Quer que eu crie uma meta de reserva de emergência?'),
    };
  }

  // Maior gasto / categorias
  if (has(text, /(maior gasto|onde.*gast|categoria|mais gast|para onde)/)) {
    if (!st.ranking.length) return { reply: 'Ainda não tem gastos neste mês. Me conte o primeiro, tipo “gastei 30 no almoço”.' };
    const top = st.ranking.slice(0, 3).map(([n, v]) => `${n} (${brl(v)})`).join(', ');
    return {
      reply: `Seus maiores gastos do mês por categoria: ${top}.` + (st.biggest ? ` O maior lançamento foi “${st.biggest.description ?? st.biggest.category.name}”, de ${brl(st.biggest.amount)}.` : ''),
    };
  }

  // Quanto gastei / saldo / resumo
  if (has(text, /(quanto|saldo|resumo|gastei|sobrou|sobra|como estou|como to|balanco)/)) {
    const rate = st.income > 0 ? Math.round((st.balance / st.income) * 100) : 0;
    return {
      reply:
        `Neste mês entraram ${brl(st.income)} e saíram ${brl(st.spent)}, então sobram ${brl(st.balance)}` +
        (st.income > 0 ? ` (${rate}% da renda).` : '.') +
        (rate >= 20 ? ' Está ótimo: acima dos 20% que costumam ser recomendados para guardar.' : rate > 0 ? ' Tente chegar a 20% guardados; corte primeiro no que é variável, como lazer e delivery.' : ' Os gastos passaram da renda; vale revisar as maiores categorias.'),
    };
  }

  // Metas
  if (has(text, /(minhas metas|como estao|progresso|meta)/)) {
    if (!goals.length) return { reply: 'Você ainda não tem metas. Diga algo como “quero juntar 5000 para uma viagem em 10 meses”.' };
    const lines = goals.map(withProgress).map((g) => `${g.name}: ${brl(g.savedAmount)} de ${brl(g.targetAmount)} (${Math.round(g.progressPercentage)}%)`).join('; ');
    return { reply: `Suas metas: ${lines}.` };
  }

  // Dicas de economia
  if (has(text, /(dica|economizar|gastar menos|cortar|apertado|divida)/)) {
    const top = st.ranking[0];
    return {
      reply:
        (top ? `Seu maior gasto variável é ${top[0]} (${brl(top[1])}). Reduzir 15% dele já libera ${brl(top[1] * 0.15)} por mês. ` : '') +
        'Outras ideias rápidas: revise assinaturas que não usa, defina um teto semanal para delivery e transfira o valor da meta no dia em que o salário cair.',
    };
  }

  // Saudações e ajuda
  if (has(text, /^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa|hey)\b/) || has(text, /(ajuda|o que voce faz|como funciona)/)) {
    return {
      reply:
        'Oi! Sou o Fini. Posso registrar gastos e entradas (“gastei 45 no almoço”), criar metas (“quero juntar 5 mil para uma viagem em 10 meses”), ' +
        'mostrar seu resumo (“quanto sobrou este mês?”) e onde mais você gasta. Tudo que eu sugerir salvar passa por você antes.',
    };
  }

  if (has(text, /(obrigad|valeu|show|perfeito|top)/)) return { reply: 'Por nada! Se precisar, é só chamar.' };

  return {
    reply:
      'Não entendi bem. Neste modo de demonstração eu entendo coisas como: “gastei 50 no mercado”, “recebi 800 de freela”, ' +
      '“quanto sobrou este mês?”, “onde eu mais gasto?” e “quero juntar 10 mil para um carro em 24 meses”.',
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
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const body = init.body && !isForm ? JSON.parse(String(init.body)) : undefined;
  const p = pathname.replace('/api/v1', '');
  const authed = !!(init.headers as Record<string, string> | undefined)?.Authorization;

  const auth = (name: string, email: string) => {
    user = { id: 'u-1', email, name, onboardingCompleted: user?.onboardingCompleted ?? false, avatarUrl: user?.avatarUrl ?? null, plan: 'FREE' };
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
  if (p === '/users/profile') return json(200, { fullName: user?.name, avatarUrl: user?.avatarUrl ?? null, onboardingCompleted: user?.onboardingCompleted, communicationStyle: 'FRIENDLY', knowledgeLevel: 'BEGINNER' });

  if (p === '/users/me/avatar' && method === 'PUT') {
    // Demonstração: guarda o arquivo local escolhido (não sobe para lugar nenhum).
    const file = (init.body as unknown as { _parts?: [string, { uri?: string }][] })?._parts?.[0]?.[1];
    const avatarUrl = typeof file?.uri === 'string' ? file.uri : null;
    if (user) user = { ...user, avatarUrl };
    return json(200, { avatarUrl });
  }
  if (p === '/users/me/avatar' && method === 'DELETE') {
    if (user) user = { ...user, avatarUrl: null };
    return json(200, {});
  }

  if (p === '/categories') {
    const type = q.get('type');
    return json(200, type ? categories.filter((c) => c.transactionType === type) : categories);
  }

  if (p === '/transactions' && method === 'GET') {
    const list = transactions.filter((t) => inRange(t, q.get('startDate'), q.get('endDate'))).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
    return json(200, { content: list, totalElements: list.length, totalPages: 1, number: 0, size: list.length, last: true });
  }
  if (p === '/transactions' && method === 'POST') {
    // Idempotency-Key: a mesma chave devolve o lançamento já criado.
    const key = (init.headers as Record<string, string> | undefined)?.['Idempotency-Key'];
    if (key && idemTx.has(key)) return json(201, transactions.find((t) => t.id === idemTx.get(key)));
    const t: Transaction = { id: uid(), ...body, category: cat(body.categoryId), source: 'MANUAL' };
    transactions = [t, ...transactions];
    if (key) idemTx.set(key, t.id);
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
  const actionMatch = p.match(/^\/chat\/actions\/([^/]+)$/);
  if (actionMatch && method === 'PUT') {
    for (const h of history) for (const a of h.proposedActions ?? []) if (a.id === actionMatch[1]) a.status = body.status;
    return json(204);
  }
  if (p === '/chat/history' && method === 'DELETE') { history.length = 0; return json(200, {}); }
  if (p === '/chat/stats') { const used = history.filter((h) => h.role === 'USER').length; return json(200, { plan: 'FREE', messagesUsedThisMonth: used, monthlyLimit: 50, remainingThisMonth: 50 - used }); }

  return json(404, { message: 'Rota não encontrada no modo demonstração' });
};
