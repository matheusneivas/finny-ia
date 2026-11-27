import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { CodeField } from '@/components/code-field';
import { Text } from '@/components/text';
import { TextField, type TextFieldHandle } from '@/components/text-field';
import { env } from '@/config/env';
import { useCountdown } from '@/hooks/use-countdown';
import { ApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/auth-context';
import { spacing } from '@/theme';
import { fieldErrors, forgotSchema, resetSchema } from '@/utils/validation';

import { AuthShell } from './auth-shell';

/**
 * Esqueci a senha: 1) e-mail, 2) código + senha nova. A API responde igual
 * exista ou não a conta, para não revelar quem está cadastrado.
 */
export function ForgotPassword({ initialEmail }: { initialEmail?: string }) {
  const { signIn } = useAuth();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { remaining, start } = useCountdown();
  const passwordRef = useRef<TextFieldHandle>(null);
  const confirmRef = useRef<TextFieldHandle>(null);

  async function requestCode() {
    setFormError(null);
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    try {
      await authApi.forgotPassword(parsed.data.email.toLowerCase());
      start(60);
      setStep('reset');
    } catch (e) {
      if (e instanceof ApiError && e.retryAfter) {
        // Já pediu há pouco: o código anterior ainda vale.
        start(e.retryAfter);
        setStep('reset');
      } else if (e instanceof ApiError && e.status === 404) {
        // API ainda sem a rota de troca de senha.
        setFormError('A troca de senha pelo app chega em breve. Por enquanto, fale com o suporte do Fini.');
      } else {
        setFormError(e instanceof ApiError ? e.message : 'Não foi possível enviar agora.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setFormError(null);
    const parsed = resetSchema.safeParse({ code, newPassword, confirmPassword });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setLoading(true);
    const normalized = email.trim().toLowerCase();
    try {
      await authApi.resetPassword(normalized, parsed.data.code, parsed.data.newPassword);
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      setFormError(e instanceof ApiError ? e.message : 'Não foi possível trocar a senha agora.');
      setLoading(false);
      return;
    }
    try {
      await signIn(normalized, parsed.data.newPassword);
    } catch {
      setFormError('Senha trocada! Agora é só entrar com a senha nova.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'email') {
    return (
      <AuthShell title="Esqueceu a senha?" subtitle="Informe seu e-mail e mandamos um código para criar uma senha nova.">
        <TextField
          label="E-mail"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="send"
          autoFocus={!initialEmail}
          onSubmitEditing={() => void requestCode()}
        />
        {formError ? (
          <Text variant="label" color="danger" accessibilityLiveRegion="assertive">
            {formError}
          </Text>
        ) : null}
        <Button title="Enviar código" size="lg" fullWidth loading={loading} onPress={() => void requestCode()} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crie uma senha nova"
      subtitle={`Se existir uma conta com ${email.trim()}, o código chega em instantes.`}
      onBack={() => {
        setStep('email');
        setCode('');
        setErrors({});
        setFormError(null);
      }}>
      <View style={styles.block}>
        <Text variant="label" color="textSecondary">
          Código
        </Text>
        <CodeField
          value={code}
          onChange={setCode}
          onComplete={() => passwordRef.current?.focus()}
          error={errors.code}
          autoFocus
        />
        {env.useMockApi ? (
          <Text variant="caption" color="warning">
            Modo demonstração: o código é 123456.
          </Text>
        ) : null}
      </View>
      <TextField
        ref={passwordRef}
        label="Senha nova"
        icon="lock"
        secret
        value={newPassword}
        onChangeText={setNewPassword}
        error={errors.newPassword}
        hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número."
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <TextField
        ref={confirmRef}
        label="Repita a senha nova"
        icon="lock"
        secret
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void reset()}
      />
      {formError ? (
        <Text variant="label" color="danger" accessibilityLiveRegion="assertive">
          {formError}
        </Text>
      ) : null}
      <Button title="Trocar senha e entrar" size="lg" fullWidth loading={loading} onPress={() => void reset()} />
      <Button
        title={remaining > 0 ? `Reenviar código em ${remaining}s` : 'Reenviar código'}
        variant="ghost"
        fullWidth
        disabled={remaining > 0 || loading}
        onPress={() => void requestCode()}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
});
