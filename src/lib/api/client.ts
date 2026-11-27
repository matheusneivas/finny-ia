import { env } from '@/config/env';
import { tokenStorage } from '@/lib/auth/token-storage';

import type { ApiErrorBody, AuthResponse } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** false = rota pública (login/cadastro), sem Authorization. */
  auth?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/** Chamado quando a sessão expira de vez (refresh falhou). O AuthProvider registra. */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

/** Transporte trocável: o modo demonstração injeta uma API falsa aqui. */
export type Transport = (path: string, init: RequestInit) => Promise<Response>;
let transport: Transport = (path, init) => fetch(`${env.apiUrl}${path}`, init);
export function setTransport(t: Transport) {
  transport = t;
}

function buildPath(path: string, query?: RequestOptions['query']) {
  if (!query) return path;
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

const FRIENDLY_MESSAGES: Record<number, string> = {
  0: 'Não consegui falar com o servidor. Verifique sua internet e tente de novo em instantes.',
  400: 'Confira os dados e tente de novo.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para isso.',
  404: 'Não encontramos o que você procurava.',
  409: 'Esse registro já existe.',
  422: 'Você atingiu o limite deste mês.',
  429: 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  500: 'Tivemos um problema no servidor. Tente de novo em instantes.',
  503: 'O Fini está indisponível agora. Essa mensagem não contou no seu limite.',
};

async function toApiError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // corpo vazio ou não-JSON: usa mensagem padrão
  }
  // Para 5xx não repassamos a mensagem do servidor (pode vazar detalhes internos).
  const serverMessage = res.status < 500 ? body?.message : undefined;
  // 503 tem mensagem própria (IA fora do ar); demais 5xx caem na genérica.
  let message =
    serverMessage || FRIENDLY_MESSAGES[res.status] || FRIENDLY_MESSAGES[res.status >= 500 ? 500 : 400];
  if (res.status === 429) {
    const retry = Number(res.headers.get('Retry-After'));
    if (Number.isFinite(retry) && retry > 0) message = `Muitas tentativas. Tente de novo em ${Math.ceil(retry)}s.`;
  }
  return new ApiError(res.status, message, body?.errors);
}

/**
 * Requisições lentas (servidor dormindo no Render). A UI assina para mostrar
 * o aviso "acordando o servidor" enquanto houver alguma pendente há mais de 4s.
 */
let slowCount = 0;
const slowListeners = new Set<(slow: boolean) => void>();
function setSlow(delta: 1 | -1) {
  const before = slowCount > 0;
  slowCount = Math.max(0, slowCount + delta);
  const after = slowCount > 0;
  if (before !== after) slowListeners.forEach((l) => l(after));
}
export function subscribeSlowRequests(listener: (slow: boolean) => void) {
  slowListeners.add(listener);
  return () => {
    slowListeners.delete(listener);
  };
}

/** Acorda o servidor em segundo plano assim que o app abre. */
export function warmUpServer() {
  void transport('/actuator/health', { method: 'GET' }).catch(() => undefined);
}

async function rawRequest(path: string, opts: RequestOptions, accessToken: string | null): Promise<Response> {
  let markedSlow = false;
  const slowTimer = setTimeout(() => {
    markedSlow = true;
    setSlow(1);
  }, env.slowRequestMs);
  try {
    return await rawRequestInner(path, opts, accessToken);
  } finally {
    clearTimeout(slowTimer);
    if (markedSlow) setSlow(-1);
  }
}

async function rawRequestInner(path: string, opts: RequestOptions, accessToken: string | null): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? env.requestTimeoutMs);
  opts.signal?.addEventListener('abort', () => controller.abort());

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    return await transport(buildPath(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    // Não registramos o erro bruto: pode conter URL e dados da requisição.
    throw new ApiError(0, FRIENDLY_MESSAGES[0]);
  } finally {
    clearTimeout(timeout);
  }
}

/** Um único refresh por vez, mesmo com várias requisições recebendo 401 juntas. */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return null;
      const res = await rawRequest('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken } }, null);
      if (!res.ok) return null;
      const data = (await res.json()) as AuthResponse;
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    })()
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const useAuth = opts.auth !== false;
  let token = useAuth ? await tokenStorage.getAccessToken() : null;
  let res = await rawRequest(path, opts, token);

  if (res.status === 401 && useAuth) {
    token = await refreshAccessToken();
    if (!token) {
      await tokenStorage.clear();
      onSessionExpired?.();
      throw new ApiError(401, FRIENDLY_MESSAGES[401]);
    }
    res = await rawRequest(path, opts, token);
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};
