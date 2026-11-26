import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { TextField, type TextFieldHandle } from '@/components/text-field';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { radius, spacing, useColors } from '@/theme';
import { fieldErrors, passwordStrength, signUpSchema } from '@/utils/validation';

import { AuthShell } from './auth-shell';

const strengthLabel = ['Fraca', 'Fraca', 'Boa', 'Forte'] as const;

export function SignUp() {
  const colors = useColors();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextFieldHandle>(null);
  const passwordRef = useRef<TextFieldHandle>(null);

  const strength = passwordStrength(password);
  const strengthColor = [colors.danger, colors.danger, colors.warning, colors.primary][strength];

  async function submit() {
    setFormError(null);
    const parsed = signUpSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await signUp(parsed.data.fullName, parsed.data.email, parsed.data.password);
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      setFormError(e instanceof ApiError ? e.message : 'Não foi possível criar sua conta agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Crie sua conta" subtitle="Leva menos de um minuto.">
      <TextField
        label="Nome"
        value={fullName}
        onChangeText={setFullName}
        error={errors.fullName}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
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
      <View style={styles.passwordBlock}>
        <TextField
          ref={passwordRef}
          label="Senha"
          icon="lock"
          secret
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número."
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {password ? (
          <View style={styles.strength}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.bar, { backgroundColor: i <= strength ? strengthColor : colors.surfaceMuted }]} />
            ))}
            <Text variant="caption" style={{ color: strengthColor }}>
              {strengthLabel[strength]}
            </Text>
          </View>
        ) : null}
      </View>
      {formError ? (
        <Text variant="label" color="danger" accessibilityLiveRegion="assertive">
          {formError}
        </Text>
      ) : null}
      <Button title="Criar conta" size="lg" fullWidth loading={loading} onPress={submit} />
      <Text variant="caption" color="textMuted" align="center">
        Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.
      </Text>
      <Button title="Já tenho conta" variant="ghost" fullWidth onPress={() => router.replace('/entrar')} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  passwordBlock: { gap: spacing.sm },
  strength: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bar: { flex: 1, height: 4, borderRadius: radius.full },
});
