import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { TextField, type TextFieldHandle } from '@/components/text-field';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { chooseAvatarSource, pickAvatar, uploadAvatar } from '@/lib/avatar';
import { radius, spacing, useColors } from '@/theme';
import { maskCpf, maskPhone } from '@/utils/documents';
import { fieldErrors, passwordStrength, signUpSchema } from '@/utils/validation';

import { AuthShell } from './auth-shell';

const strengthLabel = ['Fraca', 'Fraca', 'Boa', 'Forte'] as const;

export function SignUp() {
  const colors = useColors();
  const { signUp, setAvatarUrl } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextFieldHandle>(null);
  const cpfRef = useRef<TextFieldHandle>(null);
  const phoneRef = useRef<TextFieldHandle>(null);
  const passwordRef = useRef<TextFieldHandle>(null);
  const confirmRef = useRef<TextFieldHandle>(null);

  const strength = passwordStrength(password);
  const strengthColor = [colors.danger, colors.danger, colors.warning, colors.primary][strength];

  async function submit() {
    setFormError(null);
    setEmailTaken(false);
    const parsed = signUpSchema.safeParse({ fullName, email, cpf, phone, password, confirmPassword });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await signUp({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        password: parsed.data.password,
        cpf: parsed.data.cpf,
        phone: parsed.data.phone,
      });
      // A foto sobe depois da conta criada; se falhar, dá para trocar no Perfil.
      if (photo) {
        setAvatarUrl(photo);
        uploadAvatar(photo)
          .then(setAvatarUrl)
          .catch(() => setAvatarUrl(null));
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        if (/cpf/i.test(e.message)) {
          // Um cadastro por CPF: a pessoa já tem conta com outro e-mail.
          setErrors({ cpf: 'Esse CPF já tem uma conta no Finny. Entre com o e-mail dela ou recupere a senha.' });
          return;
        }
        // E-mail já cadastrado: oferece entrar ou recuperar a senha.
        setEmailTaken(true);
        return;
      }
      if (e instanceof ApiError && e.status === 422 && /cpf/i.test(e.message)) {
        setErrors({ cpf: 'CPF inválido' });
        return;
      }
      if (e instanceof ApiError && e.status === 422 && /telefone/i.test(e.message)) {
        setErrors({ phone: e.message });
        return;
      }
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      setFormError(
        e instanceof ApiError && e.isNetwork
          ? `${e.message} Se o problema continuar, tente "Já tenho conta": a conta pode ter sido criada mesmo assim.`
          : e instanceof ApiError
            ? e.message
            : 'Não foi possível criar sua conta agora.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Crie sua conta" subtitle="Leva menos de um minuto.">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photo ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}
        onPress={() =>
          chooseAvatarSource(
            (source) => void pickAvatar(source).then((uri) => uri && setPhoto(uri)),
            photo ? () => setPhoto(null) : undefined,
          )
        }
        style={({ pressed }) => [styles.photoRow, { opacity: pressed ? 0.7 : 1 }]}>
        <Avatar url={photo} name={fullName} size={64} editable />
        <View style={styles.photoText}>
          <Text variant="bodyStrong">{photo ? 'Foto escolhida' : 'Adicionar foto'}</Text>
          <Text variant="caption" color="textSecondary">
            Opcional. Você pode mudar depois no Perfil.
          </Text>
        </View>
      </Pressable>
      <TextField
        label="Nome completo"
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
        onSubmitEditing={() => cpfRef.current?.focus()}
      />
      <TextField
        ref={cpfRef}
        label="CPF"
        placeholder="000.000.000-00"
        value={cpf}
        onChangeText={(t) => setCpf(maskCpf(t))}
        error={errors.cpf}
        hint="Um cadastro por pessoa. Guardamos o CPF de forma protegida, nunca em texto."
        keyboardType="number-pad"
        maxLength={14}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <TextField
        ref={phoneRef}
        label="Celular"
        placeholder="(11) 98765-4321"
        value={phone}
        onChangeText={(t) => setPhone(maskPhone(t))}
        error={errors.phone}
        autoComplete="tel"
        textContentType="telephoneNumber"
        keyboardType="phone-pad"
        maxLength={15}
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
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
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
      <TextField
        ref={confirmRef}
        label="Repita a senha"
        icon="lock"
        secret
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {emailTaken ? (
        <View style={[styles.taken, { backgroundColor: colors.warningSoft }]} accessibilityLiveRegion="assertive">
          <Text variant="bodyStrong">Já existe uma conta com esse e-mail.</Text>
          <Text variant="label" color="textSecondary">
            Quer entrar ou recuperar a senha?
          </Text>
          <View style={styles.takenActions}>
            <Button
              title="Entrar"
              size="sm"
              style={styles.flex}
              onPress={() => router.replace({ pathname: '/entrar', params: { email: email.trim() } })}
            />
            <Button
              title="Recuperar senha"
              size="sm"
              variant="secondary"
              style={styles.flex}
              onPress={() => router.push({ pathname: '/esqueci-senha', params: { email: email.trim() } })}
            />
          </View>
        </View>
      ) : null}
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
  flex: { flex: 1 },
  taken: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.md },
  takenActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  passwordBlock: { gap: spacing.sm },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  photoText: { flex: 1, gap: spacing.xxs },
  strength: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bar: { flex: 1, height: 4, borderRadius: radius.full },
});
