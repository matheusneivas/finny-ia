/**
 * Configuração pública do app. Só entra aqui o que pode ser visto por qualquer
 * pessoa que abra o bundle: variáveis EXPO_PUBLIC_* ficam embutidas no app.
 * NUNCA coloque chaves de IA, segredos de JWT ou senhas aqui. A IA roda na API.
 */
/** API no ar (Render, plano grátis: dorme sem uso e leva ~1 min para acordar). */
const DEFAULT_API_URL = 'https://fini-api-rosi.onrender.com';
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

function normalizeApiUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  const isLocal = /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)(:\d+)?$/.test(trimmed);
  if (!__DEV__ && !trimmed.startsWith('https://')) {
    // Em produção, tokens e dados financeiros só trafegam por HTTPS.
    throw new Error('EXPO_PUBLIC_API_URL precisa usar https:// em produção.');
  }
  if (__DEV__ && !trimmed.startsWith('https://') && !isLocal) {
    throw new Error('Em desenvolvimento, use https:// ou um endereço local (localhost / rede local).');
  }
  return trimmed;
}

export const env = {
  apiUrl: normalizeApiUrl(rawApiUrl),
  /** Modo demonstração: API falsa em memória, só em desenvolvimento. */
  useMockApi: __DEV__ && process.env.EXPO_PUBLIC_API_MOCK === 'true',
  // Folga para o servidor acordar (cold start do Render pode passar de 1 minuto).
  requestTimeoutMs: 90_000,
  chatTimeoutMs: 120_000,
  /** Depois disso sem resposta, mostramos o aviso "acordando o servidor". */
  slowRequestMs: 4_000,
} as const;
