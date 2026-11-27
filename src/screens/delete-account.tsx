import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { SheetFrame } from '@/components/sheet-frame';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { ApiError } from '@/lib/api/client';
import { accountApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth/auth-context';
import { radius, spacing, useColors } from '@/theme';

/** Excluir a conta de vez (LGPD). Pede a senha de novo para confirmar. */
export function DeleteAccountScreen() {
  const colors = useColors();
  const { user, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    if (!password) {
      setError('Digite sua senha para confirmar.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await accountApi.remove(password);
      // A conta já não existe: limpa a sessão deste aparelho e volta para o início.
      await signOut();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível excluir agora. Tente de novo em instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SheetFrame
      title="Excluir minha conta"
      footer={<Button title="Excluir minha conta para sempre" variant="danger" icon="trash" fullWidth loading={loading} onPress={confirm} />}>
      <View style={[styles.warning, { backgroundColor: colors.warningSoft }]}>
        <Text variant="bodyStrong">Isso não tem volta.</Text>
        <Text variant="label" color="textSecondary">
          Vamos apagar sua conta e tudo o que está nela: lançamentos, metas, conversas com a IA, foto e dados do cadastro.
          {user?.plan === 'PREMIUM' ? ' A renovação do Premium no cartão também é cancelada.' : ''}
        </Text>
      </View>
      <Text variant="body" color="textSecondary">
        Quer guardar uma cópia antes? Volte ao Perfil e toque em “Baixar meus dados”.
      </Text>
      <TextField
        label="Sua senha"
        icon="lock"
        secret
        value={password}
        onChangeText={setPassword}
        error={error ?? undefined}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={confirm}
      />
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  warning: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.md },
});
