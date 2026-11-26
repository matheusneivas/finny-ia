import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, shadows, spacing, useColors, type ColorToken } from '@/theme';

export function Card({
  children,
  style,
  tone = 'surface',
  padding = 'lg',
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: Extract<ColorToken, 'surface' | 'surfaceMuted' | 'primarySoft' | 'aiSoft' | 'expenseSoft' | 'warningSoft'>;
  padding?: keyof typeof spacing;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const colors = useColors();
  const base: ViewStyle = {
    backgroundColor: colors[tone],
    padding: spacing[padding],
    borderColor: tone === 'surface' ? colors.border : 'transparent',
    boxShadow: tone === 'surface' ? shadows.card : undefined,
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.card, base, { opacity: pressed ? 0.85 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, base, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
});
