/**
 * Web: SecureStore não existe no navegador.
 * - Access token só em memória (some ao fechar a aba, não fica exposto em localStorage).
 * - Refresh token em sessionStorage (escopo da aba, apagado ao fechar).
 *
 * SUPOSIÇÃO: para a versão web de produção, o ideal é a API enviar o refresh
 * token em cookie HttpOnly + SameSite=Strict. Quando a API suportar, troque
 * este arquivo para não guardar o refresh token no JavaScript.
 */
const REFRESH_KEY = 'fini.refreshToken';

let memoryAccessToken: string | null = null;

function session(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return memoryAccessToken;
  },

  async getRefreshToken(): Promise<string | null> {
    return session()?.getItem(REFRESH_KEY) ?? null;
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    memoryAccessToken = accessToken;
    session()?.setItem(REFRESH_KEY, refreshToken);
  },

  async clear(): Promise<void> {
    memoryAccessToken = null;
    session()?.removeItem(REFRESH_KEY);
  },
};
