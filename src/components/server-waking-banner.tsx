import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { subscribeSlowRequests } from '@/lib/api/client';
import { radius, shadows, spacing, useColors } from '@/theme';

import { Text } from './text';

/**
 * Aviso no topo enquanto o servidor demora a responder. No plano grátis do
 * Render a API dorme sem uso e leva cerca de 1 minuto para acordar.
 */
export function ServerWakingBanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [slow, setSlow] = useState(false);

  useEffect(() => subscribeSlowRequests(setSlow), []);

  if (!slow) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + spacing.sm }]}>
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <View style={styles.text}>
          <Text variant="label">Acordando o servidor…</Text>
          <Text variant="caption" color="textSecondary">
            Na primeira vez do dia pode levar até 1 minuto.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center', zIndex: 50 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: shadows.raised,
    maxWidth: 420,
    width: '100%',
  },
  text: { flex: 1, gap: spacing.xxs },
});
