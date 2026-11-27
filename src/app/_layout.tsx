import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppLock } from '@/components/app-lock';
import { ServerWakingBanner } from '@/components/server-waking-banner';
import { ApiError } from '@/lib/api/client';
import { setupApi } from '@/lib/api/setup';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { PreferencesProvider } from '@/lib/preferences';
import { getColors } from '@/theme';

setupApi();
SplashScreen.preventAutoHideAsync();

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Não insiste em erros de autenticação/validação, só em falhas de rede/servidor.
        retry: (count, error) => error instanceof ApiError && (error.isNetwork || error.status >= 500) && count < 2,
      },
    },
  });
}

export default function RootLayout() {
  const [queryClient] = useState(makeQueryClient);
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = getColors(scheme);
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: c.primary, background: c.background, card: c.surface, text: c.text, border: c.border },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PreferencesProvider>
          <AuthProvider>
            <ThemeProvider value={navTheme}>
              <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
              <AppLock>
                <RootNavigator />
                <ServerWakingBanner />
              </AppLock>
            </ThemeProvider>
          </AuthProvider>
        </PreferencesProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Formulários abrem como "page sheet" (modal do iOS com gesto de arrastar para fechar).
 * O formSheet com detents posicionava o conteúdo por cima do título no iPhone.
 */
const sheetOptions = { presentation: 'modal', headerShown: false } as const;

function RootNavigator() {
  const { status, user } = useAuth();

  useEffect(() => {
    if (status !== 'loading') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;

  const signedIn = status === 'signedIn';
  // Contas antigas não têm o campo: só bloqueia quando a API diz false.
  const verified = signedIn && user?.emailVerified !== false;
  const ready = verified && !!user?.onboardingCompleted;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && !verified}>
        <Stack.Screen name="verificar-email" />
      </Stack.Protected>

      <Stack.Protected guard={verified && !ready}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={ready}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="transacao"
          options={sheetOptions}
        />
        <Stack.Screen
          name="meta"
          options={sheetOptions}
        />
        <Stack.Screen
          name="aporte"
          options={sheetOptions}
        />
        <Stack.Screen
          name="atalhos"
          options={sheetOptions}
        />
        <Stack.Screen
          name="premium"
          options={sheetOptions}
        />
      </Stack.Protected>

    </Stack>
  );
}
