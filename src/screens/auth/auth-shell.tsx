import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FiniMark } from '@/components/brand';
import { IconButton } from '@/components/button';
import { Text } from '@/components/text';
import { maxContentWidth, spacing, useColors } from '@/theme';

export function AuthShell({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Ação do botão voltar; por padrão volta uma tela. */
  onBack?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.back}>
          <IconButton icon="chevronLeft" label="Voltar" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} />
        </View>
        <View style={styles.header}>
          <FiniMark size={48} />
          <Text variant="title">{title}</Text>
          <Text variant="body" color="textSecondary">
            {subtitle}
          </Text>
        </View>
        <View style={styles.form}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: maxContentWidth / 1.4, alignSelf: 'center', paddingHorizontal: spacing.xl, gap: spacing.xl },
  back: { marginLeft: -spacing.md },
  header: { gap: spacing.sm },
  form: { gap: spacing.lg },
});
