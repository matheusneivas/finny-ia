import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';

/**
 * Atalhos do Fini. Cada um tem um link direto (fini://novo-gasto) que serve
 * para o widget, as ações do ícone, a Siri / app Atalhos e links em geral.
 *
 * Os parâmetros que chegam por link vêm de fora do app: tudo é validado aqui
 * e nada vira requisição sem o usuário tocar em "Salvar".
 */
export type ShortcutId = 'novo-gasto' | 'nova-entrada' | 'guardar' | 'chat';

export interface Shortcut {
  id: ShortcutId;
  title: string;
  subtitle: string;
  /** SF Symbol usado nas ações do ícone no iPhone. */
  iosSymbol: string;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { id: 'novo-gasto', title: 'Novo gasto', subtitle: 'Anotar um gasto', iosSymbol: 'minus.circle.fill' },
  { id: 'nova-entrada', title: 'Nova entrada', subtitle: 'Anotar um ganho', iosSymbol: 'plus.circle.fill' },
  { id: 'guardar', title: 'Guardar na meta', subtitle: 'Colocar dinheiro numa meta', iosSymbol: 'banknote.fill' },
  { id: 'chat', title: 'Falar com o Fini', subtitle: 'Abrir o chat', iosSymbol: 'bubble.left.and.bubble.right.fill' },
];

/** Valor vindo de link: "30", "30,50", "1.234,56". Devolve null se não for um valor válido. */
export function parseAmountParam(raw: unknown): number | null {
  if (typeof raw !== 'string' || raw.length > 20) return null;
  let s = raw.trim().replace(/^r\$\s*/i, '');
  // Formato brasileiro: ponto de milhar e vírgula decimal.
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= 1e9 ? Math.round(n * 100) / 100 : null;
}

/** Texto vindo de link: sem caracteres de controle e com tamanho limitado. */
export function parseTextParam(raw: unknown, max = 200): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const clean = raw.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
  return clean || undefined;
}

/** Para onde cada atalho leva dentro do app. */
export function shortcutTarget(id: ShortcutId, params: { valor?: string; descricao?: string; meta?: string }): Href {
  const valor = parseAmountParam(params.valor);
  const descricao = parseTextParam(params.descricao);
  switch (id) {
    case 'novo-gasto':
    case 'nova-entrada':
      return {
        pathname: '/transacao',
        params: {
          tipo: id === 'nova-entrada' ? 'entrada' : 'saida',
          ...(valor ? { valor: String(valor) } : {}),
          ...(descricao ? { descricao } : {}),
        },
      };
    case 'guardar': {
      const meta = typeof params.meta === 'string' && /^[\w-]{1,64}$/.test(params.meta) ? params.meta : undefined;
      return { pathname: '/aporte', params: { ...(meta ? { id: meta } : {}), ...(valor ? { valor: String(valor) } : {}) } };
    }
    case 'chat':
      return '/';
  }
}

/**
 * Link completo do atalho. No app instalado é fini://novo-gasto; no Expo Go
 * é exp://…/--/novo-gasto (por isso dá para testar já).
 */
export function shortcutUrl(id: ShortcutId, query?: Record<string, string>) {
  return Linking.createURL(`/${id}`, query ? { queryParams: query } : undefined);
}

/** Lê "a=1&b=2" sem depender do URLSearchParams (incompleto no React Native). */
function parseQuery(qs: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of qs.split('&').slice(0, 10)) {
    const [k, v = ''] = part.split('=');
    if (!k) continue;
    try {
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    } catch {
      // parâmetro malformado: ignora
    }
  }
  return out;
}

/**
 * Reconhece um link de atalho: fini://novo-gasto?valor=30, ou no Expo Go
 * exp://…/--/novo-gasto?valor=30. Devolve para onde ir, ou null se não for atalho.
 */
export function matchShortcutLink(path: string): Href | null {
  const m = /(?:^|[/:])(novo-gasto|nova-entrada|guardar|chat)\/?(?:\?([^#]*))?(?:#.*)?$/.exec(path);
  if (!m) return null;
  return shortcutTarget(m[1] as ShortcutId, parseQuery(m[2] ?? ''));
}

/**
 * Atalho esperando para abrir. Fica só em memória (nunca no aparelho) e é
 * aberto pelas abas quando a pessoa está logada; sem login, abre depois de entrar.
 */
let pending: Href | null = null;
const listeners = new Set<() => void>();

export function setPendingShortcut(href: Href | null) {
  pending = href;
  if (href) listeners.forEach((l) => l());
}
export function takePendingShortcut(): Href | null {
  const h = pending;
  pending = null;
  return h;
}
export function onPendingShortcut(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
