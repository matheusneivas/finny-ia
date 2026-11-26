import { StyleSheet, TextInput, View } from 'react-native';

import { radius, spacing, typography, useColors } from '@/theme';
import { digitsToCents, formatCentsInput } from '@/utils/money';

import { Text } from './text';

/** Campo de valor em reais. Trabalha em centavos (inteiros) para não errar arredondamento. */
export function MoneyField({
  label,
  cents,
  onChangeCents,
  error,
  large,
  autoFocus,
}: {
  label: string;
  cents: number;
  onChangeCents: (cents: number) => void;
  error?: string;
  large?: boolean;
  autoFocus?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.wrapper}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View
        style={[
          styles.field,
          large && styles.large,
          { borderColor: error ? colors.danger : colors.border, backgroundColor: colors.surface },
        ]}>
        <TextInput
          accessibilityLabel={label}
          autoFocus={autoFocus}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="R$ 0,00"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          value={formatCentsInput(cents)}
          onChangeText={(t) => onChangeCents(digitsToCents(t))}
          style={[large ? typography.money : typography.body, styles.input, { color: colors.text }]}
        />
      </View>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  large: { minHeight: 72 },
  input: { paddingVertical: spacing.md, outlineStyle: 'none' } as never,
});
