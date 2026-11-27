import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { setSessionExpiredHandler } from '@/lib/api/client';
import { authApi, onboardingApi, profileApi } from '@/lib/api/endpoints';
import type { AuthResponse, User } from '@/lib/api/types';

import { tokenStorage } from './token-storage';

/**
 * Sessão do usuário. Guardamos só dados não sensíveis do perfil (nome, e-mail,
 * status do onboarding) para abrir o app rápido; tokens ficam no tokenStorage.
 */
const USER_KEY = 'fini.user';

async function saveUser(user: User | null) {
  if (Platform.OS === 'web') return; // web: sessão vive só na aba
  if (user) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  else await SecureStore.deleteItemAsync(USER_KEY);
}

async function loadUser(): Promise<User | null> {
  if (Platform.OS === 'web') return null;
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: Status;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  markOnboardingDone: () => void;
  setAvatarUrl: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const clearSession = useCallback(async () => {
    await tokenStorage.clear();
    await saveUser(null);
    queryClient.clear(); // nada do usuário anterior fica em cache
    setUser(null);
    setStatus('signedOut');
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      void clearSession();
    });
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  // Restaura a sessão ao abrir o app.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [access, refresh, stored] = await Promise.all([
          tokenStorage.getAccessToken(),
          tokenStorage.getRefreshToken(),
          loadUser(),
        ]);
        if (!access && !refresh) {
          if (!cancelled) setStatus('signedOut');
          return;
        }
        // Confirma com o servidor (e renova o token se precisar).
        const onboarding = await onboardingApi.status().catch(() => null);
        if (cancelled) return;
        if (!onboarding && !stored) {
          setStatus('signedOut');
          return;
        }
        let next: User | null = stored
          ? { ...stored, onboardingCompleted: onboarding?.completed ?? stored.onboardingCompleted }
          : null;
        if (!next && onboarding) {
          // Web recarregada: só temos o refresh token; reconstrói o usuário pelo perfil.
          const profile = await profileApi.get().catch(() => null);
          next = { id: '', email: '', name: profile?.fullName ?? '', plan: 'FREE', onboardingCompleted: onboarding.completed };
        }
        if (cancelled) return;
        setUser(next);
        setStatus(next ? 'signedIn' : 'signedOut');
      } catch {
        if (!cancelled) setStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuth = useCallback(async (res: AuthResponse) => {
    await tokenStorage.setTokens(res.accessToken, res.refreshToken);
    await saveUser(res.user);
    setUser(res.user);
    setStatus('signedIn');
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => handleAuth(await authApi.login(email.trim().toLowerCase(), password)),
    [handleAuth],
  );

  const signUp = useCallback(
    async (fullName: string, email: string, password: string) =>
      handleAuth(await authApi.register(fullName.trim(), email.trim().toLowerCase(), password)),
    [handleAuth],
  );

  const signOut = useCallback(async () => {
    const refresh = await tokenStorage.getRefreshToken();
    // Revoga no servidor, mas sai localmente mesmo se a rede falhar.
    await authApi.logout(refresh).catch(() => undefined);
    await clearSession();
  }, [clearSession]);

  const markOnboardingDone = useCallback(() => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, onboardingCompleted: true };
      void saveUser(next);
      return next;
    });
  }, []);

  const setAvatarUrl = useCallback((avatarUrl: string | null) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, avatarUrl };
      void saveUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut, markOnboardingDone, setAvatarUrl }),
    [status, user, signIn, signUp, signOut, markOnboardingDone, setAvatarUrl],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
