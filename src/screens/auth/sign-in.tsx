import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { TextField, type TextFieldHandle } from '@/components/text-field';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { fieldErrors, signInSchema } from '@/utils/validation';

import { AuthShell } from './auth-shell';

export function SignIn() {
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email.slice(0, 254) : '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextFieldHandle>(null);

  async function submit() {
    setFormError(null);
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
    } catch (e) {
      // Mensagem genérica em 401: não revela se o e-mail existe.
      setFormError(
        e instanceof ApiError && (e.status === 401 || e.status === 400)
          ? 'E-mail ou senha incorretos.'
          : e instanceof ApiError
            ? e.message
            : 'Não foi possível entrar agora.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Entre para continuar de onde parou.">
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
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Senha"
        icon="lock"
        secret
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {formError ? (
        <Text variant="label" color="danger" accessibilityLiveRegion="assertive">
          {formError}
        </Text>
      ) : null}
      <Button title="Entrar" size="lg" fullWidth loading={loading} onPress={submit} />
      <Button
        title="Esqueci minha senha"
        variant="ghost"
        fullWidth
        onPress={() => router.push({ pathname: '/esqueci-senha', params: email.trim() ? { email: email.trim() } : {} })}
      />
      <Button title="Ainda não tenho conta" variant="ghost" fullWidth onPress={() => router.replace('/criar-conta')} />
    </AuthShell>
  );
}
