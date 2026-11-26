import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Icon, type IconName } from '@/components/icon';
import { ProgressBar } from '@/components/misc';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useChatStats, useProfile } from '@/hooks/queries';
import { useAuth } from '@/lib/auth/auth-context';
import { usePreferences } from '@/lib/preferences';
import { radius, spacing, useColors } from '@/theme';

const knowledgeLabel = { BEGINNER: 'Iniciante', INTERMEDIATE: 'Intermediário', ADVANCED: 'Avançado' } as const;
const toneLabel = { FRIENDLY: 'Amigável', DIRECT: 'Direto', FORMAL: 'Formal' } as const;

function SettingRow({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Icon name={icon} size={18} color={colors.textSecondary} />
      </View>
      <View style={styles.flex}>
        <Text variant="body">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function ProfileScreen() {
  const colors = useColors();
  const { user, signOut } = useAuth();
  const profile = useProfile();
  const stats = useChatStats();
  const { hideValues, biometricLock, setPreference } = usePreferences();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void (async () => {
      const [hw, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
      setBiometricAvailable(hw && enrolled);
    })();
  }, []);

  async function toggleBiometric(next: boolean) {
    // Confirma a biometria antes de ligar, para não trancar o usuário fora.
    if (next) {
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Ativar bloqueio do Fini' });
      if (!res.success) return;
    }
    setPreference('biometricLock', next);
  }

  function confirmSignOut() {
    if (Platform.OS === 'web') return void signOut();
    Alert.alert('Sair da conta?', 'Você vai precisar entrar de novo neste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  const name = profile.data?.fullName || user?.name || 'Você';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const used = stats.data?.messagesUsedThisMonth ?? 0;
  const limit = stats.data?.monthlyLimit ?? null;

  return (
    <Screen title="Perfil">
      <Card>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text variant="heading" color="primary">
              {initials || '•'}
            </Text>
          </View>
          <View style={styles.flex}>
            <Text variant="heading">{name}</Text>
            {user?.email ? (
              <Text variant="label" color="textSecondary">
                {user.email}
              </Text>
            ) : null}
          </View>
          <View style={[styles.plan, { backgroundColor: user?.plan === 'PREMIUM' ? colors.aiSoft : colors.surfaceMuted }]}>
            <Text variant="caption" color={user?.plan === 'PREMIUM' ? 'ai' : 'textSecondary'}>
              {user?.plan === 'PREMIUM' ? 'Premium' : 'Grátis'}
            </Text>
          </View>
        </View>
        {limit != null ? (
          <View style={styles.usage}>
            <View style={styles.usageHead}>
              <Text variant="label" color="textSecondary">
                Conversas com o Fini este mês
              </Text>
              <Text variant="label">
                {used}/{limit}
              </Text>
            </View>
            <ProgressBar value={(used / Math.max(limit, 1)) * 100} tone={used >= limit ? 'danger' : 'ai'} height={6} />
          </View>
        ) : null}
      </Card>

      <Text variant="overline" color="textSecondary">
        Como o Fini te conhece
      </Text>
      <Card>
        <SettingRow icon="school" title="Nível em finanças" subtitle={profile.data?.knowledgeLevel ? knowledgeLabel[profile.data.knowledgeLevel] : '—'} />
        <SettingRow icon="chat" title="Jeito de conversar" subtitle={profile.data?.communicationStyle ? toneLabel[profile.data.communicationStyle] : '—'} />
        <SettingRow icon="goals" title="Objetivo principal" subtitle={profile.data?.primaryGoal || '—'} />
      </Card>

      <Text variant="overline" color="textSecondary">
        Privacidade e segurança
      </Text>
      <Card>
        <SettingRow
          icon="eyeOff"
          title="Modo discreto"
          subtitle="Esconde os valores na tela"
          right={
            <Switch
              accessibilityLabel="Modo discreto"
              value={hideValues}
              onValueChange={(v) => setPreference('hideValues', v)}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          }
        />
        {Platform.OS !== 'web' ? (
          <SettingRow
            icon="faceId"
            title="Bloquear com biometria"
            subtitle={biometricAvailable ? 'Pede Face ID ou digital ao abrir' : 'Configure a biometria no aparelho'}
            right={
              <Switch
                accessibilityLabel="Bloquear com biometria"
                disabled={!biometricAvailable}
                value={biometricLock}
                onValueChange={(v) => void toggleBiometric(v)}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            }
          />
        ) : null}
        <SettingRow icon="shield" title="Seus dados" subtitle="Conexão criptografada. A IA só sugere, quem salva é você." />
      </Card>

      <Button title="Sair da conta" variant="danger" icon="logout" fullWidth onPress={confirmSignOut} />
      <Text variant="caption" color="textMuted" align="center">
        Fini · versão 1.0.0
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  plan: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full },
  usage: { gap: spacing.sm },
  usageHead: { flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
});
