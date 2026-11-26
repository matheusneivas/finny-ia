import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useColors, type ColorToken } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'ai' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantTokens: Record<Variant, { bg: ColorToken | null; fg: ColorToken; border?: ColorToken }> = {
  primary: { bg: 'primary', fg: 'onPrimary' },
  secondary: { bg: 'surface', fg: 'text', border: 'border' },
  ghost: { bg: null, fg: 'primary' },
  ai: { bg: 'ai', fg: 'onAi' },
  danger: { bg: 'expenseSoft', fg: 'danger' },
};

const sizeTokens = {
  sm: { height: 36, paddingHorizontal: spacing.md, icon: 16 },
  md: { height: 48, paddingHorizontal: spacing.lg, icon: 18 },
  lg: { height: 56, paddingHorizontal: spacing.xl, icon: 20 },
} as const;

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  fullWidth,
  style,
  accessibilityLabel,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const colors = useColors();
  const v = variantTokens[variant];
  const s = sizeTokens[size];
  const fg = colors[v.fg];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          backgroundColor: v.bg ? colors[v.bg] : 'transparent',
          borderColor: v.border ? colors[v.border] : 'transparent',
          borderWidth: v.border ? StyleSheet.hairlineWidth * 2 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed && !inactive ? 0.98 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={s.icon} color={fg} /> : null}
          <Text variant={size === 'sm' ? 'label' : 'bodyStrong'} style={{ color: fg }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Botão só de ícone (fechar, voltar, enviar). Área de toque mínima de 44pt. */
export function IconButton({
  icon,
  onPress,
  label,
  variant = 'ghost',
  size = 44,
  disabled,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  variant?: 'ghost' | 'filled' | 'ai' | 'muted';
  size?: number;
  disabled?: boolean;
}) {
  const colors = useColors();
  const bg = { ghost: 'transparent', filled: colors.primary, ai: colors.ai, muted: colors.surfaceMuted }[variant];
  const fg = { ghost: colors.text, filled: colors.onPrimary, ai: colors.onAi, muted: colors.text }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}>
      <Icon name={icon} size={Math.round(size * 0.45)} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
