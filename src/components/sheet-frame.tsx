import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { maxContentWidth, spacing, useColors } from '@/theme';

import { IconButton } from './button';
import { Text } from './text';

/** Moldura dos formulários apresentados como folha (formSheet). */
export function SheetFrame({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? spacing.xl : insets.top + spacing.md }]}>
        <Text variant="heading" accessibilityRole="header" style={styles.flex}>
          {title}
        </Text>
        <IconButton icon="close" label="Fechar" variant="muted" size={36} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg, borderColor: colors.border }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.xl, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
});
