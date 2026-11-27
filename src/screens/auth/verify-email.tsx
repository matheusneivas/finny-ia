import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { CodeField } from '@/components/code-field';
import { Text } from '@/components/text';
import { env } from '@/config/env';
import { useCountdown } from '@/hooks/use-countdown';
import { ApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/auth-context';
import { spacing } from '@/theme';
import { codeSchema } from '@/utils/validation';

import { AuthShell } from './auth-shell';

/** Logo depois do cadastro: confirma que o e-mail é da pessoa antes de usar o app. */
export function VerifyEmail() {
  const { user, verifyEmail, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  // O cadastro já mandou o primeiro código.
  const { remaining, start } = useCountdown(60);

  async function submit(value = code) {
    if (loading) return;
    const parsed = codeSchema.safeParse(value);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Código inválido');
    setError(null);
    setLoading(true);
    try {
      await verifyEmail(parsed.data);
      // O guard de rotas leva para o onboarding sozinho.
    } catch (e) {
      setCode('');
      setError(e instanceof ApiError ? e.message : 'Não foi possível confirmar agora.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      await authApi.resendVerification();
      setNotice('Enviamos um código novo. Confira também a caixa de spam.');
      start(60);
    } catch (e) {
      if (e instanceof ApiError && e.retryAfter) start(e.retryAfter);
      else setError(e instanceof ApiError ? e.message : 'Não foi possível reenviar agora.');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Confirme seu e-mail"
      subtitle={`Mandamos um código de 6 números para ${user?.email || 'seu e-mail'}.`}
      onBack={() => void signOut()}>
      <CodeField value={code} onChange={setCode} onComplete={(c) => void submit(c)} error={error ?? undefined} autoFocus />
      {env.useMockApi ? (
        <Text variant="caption" color="warning">
          Modo demonstração: o código é 123456.
        </Text>
      ) : null}
      {notice ? (
        <Text variant="label" color="primary" accessibilityLiveRegion="polite">
          {notice}
        </Text>
      ) : null}
      <Button title="Confirmar" size="lg" fullWidth loading={loading} onPress={() => void submit()} />
      <View style={styles.resend}>
        <Text variant="label" color="textSecondary">
          Não chegou?
        </Text>
        <Button
          title={remaining > 0 ? `Reenviar em ${remaining}s` : 'Reenviar código'}
          variant="ghost"
          size="sm"
          disabled={remaining > 0}
          loading={resending}
          onPress={() => void resend()}
        />
      </View>
      <Text variant="caption" color="textMuted" align="center">
        {Platform.OS === 'ios' ? 'Dica: o iPhone mostra o código em cima do teclado quando o e-mail chega. ' : ''}
        E-mail errado? Toque em voltar para sair e criar a conta de novo.
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  resend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
});
