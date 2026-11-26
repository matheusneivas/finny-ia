import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, typography, useColors } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type TextFieldHandle = ComponentRef<typeof TextInput>;

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'ref'> {
  ref?: Ref<TextFieldHandle>;
  label: string;
  error?: string;
  hint?: string;
  icon?: IconName;
  /** Campo de senha com botão de mostrar/ocultar. */
  secret?: boolean;
}

export function TextField({ label, error, hint, icon, secret, onFocus, onBlur, ref, ...props }: TextFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View style={[styles.field, { borderColor, backgroundColor: colors.surface }]}>
        {icon ? <Icon name={icon} size={18} color={colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          secureTextEntry={secret && !revealed}
          autoCorrect={secret ? false : props.autoCorrect}
          autoCapitalize={secret ? 'none' : props.autoCapitalize}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, typography.body, { color: colors.text }]}
          {...props}
        />
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={10}
            onPress={() => setRevealed((r) => !r)}>
            <Icon name={revealed ? 'eyeOff' : 'eye'} size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textMuted">
          {hint}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: { flex: 1, paddingVertical: spacing.md, outlineStyle: 'none' } as never,
});
