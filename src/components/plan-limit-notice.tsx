import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { spacing, useColors } from '@/theme';

import { Button } from './button';
import { Card } from './card';
import { Icon } from './icon';
import { Text } from './text';

/** Abre a tela do Premium (lembrando de onde veio, para o texto da tela). */
export function openPremium(reason?: 'limite') {
  router.push(reason ? { pathname: '/premium', params: { motivo: reason } } : '/premium');
}

/**
 * Aviso de limite do plano grátis (402 PLAN_LIMIT_REACHED) com o convite para o Premium.
 * A mensagem vem da API (diz qual limite foi atingido).
 */
export function PlanLimitNotice({ message, compact }: { message: string; compact?: boolean }) {
  const colors = useColors();
  return (
    <Card tone="aiSoft" padding={compact ? 'md' : 'lg'} style={styles.card}>
      <View style={styles.head} accessibilityLiveRegion="polite">
        <Icon name="crown" size={18} color={colors.ai} />
        <Text variant="bodyStrong" style={styles.flex}>
          Limite do plano grátis
        </Text>
      </View>
      <Text variant="label" color="textSecondary">
        {message} Com o Premium você usa sem limite.
      </Text>
      <Button title="Conhecer o Premium" variant="ai" size="sm" icon="crown" onPress={() => openPremium('limite')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
