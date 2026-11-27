import { useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { radius, spacing, typography, useColors } from '@/theme';

import { Text } from './text';

const LENGTH = 6;

/**
 * Campo do código de 6 dígitos. Um único TextInput invisível por baixo das
 * caixas: assim o iPhone oferece o código do e-mail no teclado
 * (textContentType oneTimeCode) e colar funciona de uma vez.
 */
export function CodeField({
  value,
  onChange,
  onComplete,
  error,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
  autoFocus?: boolean;
}) {
  const colors = useColors();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);

  function change(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, LENGTH);
    onChange(digits);
    if (digits.length === LENGTH) onComplete?.(digits);
  }

  return (
    <View style={styles.wrap}>
      <Pressable accessible={false} onPress={() => input.current?.focus()} style={styles.boxes}>
        {Array.from({ length: LENGTH }, (_, i) => {
          const active = focused && (i === value.length || (i === LENGTH - 1 && value.length === LENGTH));
          return (
            <View
              key={i}
              style={[
                styles.box,
                {
                  backgroundColor: colors.surface,
                  borderColor: error ? colors.danger : active ? colors.primary : colors.border,
                  borderWidth: active || error ? 2 : 1,
                },
              ]}>
              <Text variant="title">{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        value={value}
        onChangeText={change}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={LENGTH}
        accessibilityLabel="Código de 6 dígitos"
        accessibilityHint={error}
        caretHidden
        style={[typography.body, styles.hidden]}
      />
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  boxes: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  box: { flex: 1, aspectRatio: 0.85, maxWidth: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  // Fica por cima das caixas, transparente: recebe toque, foco e o autofill.
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, height: 64, opacity: 0.011, color: 'transparent' },
});
