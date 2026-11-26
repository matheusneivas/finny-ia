import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { categoryFallbackColors, radius, spacing, useColors, type ColorToken } from '@/theme';

import { Button } from './button';
import { Icon, resolveIcon, type IconName } from './icon';
import { Text } from './text';

export function ProgressBar({ value, tone = 'primary', height = 8 }: { value: number; tone?: ColorToken; height?: number }) {
  const colors = useColors();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[styles.track, { height, backgroundColor: colors.surfaceMuted }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors[tone] }]} />
    </View>
  );
}

/** Círculo colorido com o ícone da categoria. */
export function CategoryIcon({
  icon,
  color,
  index = 0,
  size = 40,
  fallback = 'wallet',
}: {
  icon?: string | null;
  color?: string | null;
  index?: number;
  size?: number;
  fallback?: IconName;
}) {
  const valid = color && /^#[0-9a-f]{6}$/i.test(color) ? color : categoryFallbackColors[index % categoryFallbackColors.length];
  return (
    <View style={[styles.catIcon, { width: size, height: size, backgroundColor: `${valid}22` }]}>
      <Icon name={resolveIcon(icon, fallback)} size={size * 0.48} color={valid} />
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const colors = useColors();
  return (
    <View accessibilityRole="tablist" style={[styles.segmented, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && { backgroundColor: colors.surfaceSelected, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }]}>
            <Text variant="label" color={selected ? 'text' : 'textSecondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      {icon ? <Icon name={icon} size={16} color={selected ? colors.primary : colors.textSecondary} /> : null}
      <Text variant="label" color={selected ? 'primary' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Icon name={icon} size={28} color={colors.primary} />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="textSecondary" align="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} icon="plus" /> : null}
    </View>
  );
}

export function LoadingState({ style }: { style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View style={[styles.loading, style]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.empty}>
      <Text variant="body" color="textSecondary" align="center">
        {message}
      </Text>
      {onRetry ? <Button title="Tentar de novo" variant="secondary" size="sm" onPress={onRetry} /> : null}
    </View>
  );
}

export function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Text variant="overline" color="textSecondary">
        {children}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.full, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: radius.full },
  catIcon: { borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: spacing.xxs + 1 },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm + 2,
    borderCurve: 'continuous',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
});
