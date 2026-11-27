import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FiniMark } from '@/components/brand';
import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/text';
import { maxContentWidth, radius, spacing, useColors } from '@/theme';

const features: { icon: IconName; title: string; text: string }[] = [
  { icon: 'chat', title: 'Converse com o Finny', text: '“Gastei 45 no almoço” e pronto, está na planilha.' },
  { icon: 'sheet', title: 'Veja para onde vai o dinheiro', text: 'Resumo do mês por categoria, sem fórmula.' },
  { icon: 'goals', title: 'Metas de verdade', text: 'Carro, casa, viagem: quanto guardar por mês.' },
  { icon: 'shield', title: 'Seus dados protegidos', text: 'Acesso criptografado e bloqueio com Face ID.' },
];

export function Welcome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <FiniMark size={72} />
          <Text variant="display" align="center">
            Seu dinheiro,{'\n'}em uma conversa.
          </Text>
          <Text variant="body" color="textSecondary" align="center">
            O Finny organiza seus gastos, acompanha suas metas e te ajuda a decidir melhor.
          </Text>
        </View>

        <View style={styles.features}>
          {features.map((f) => (
            <View key={f.title} style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
                <Icon name={f.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text variant="bodyStrong">{f.title}</Text>
                <Text variant="label" color="textSecondary">
                  {f.text}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button title="Criar conta grátis" size="lg" fullWidth onPress={() => router.push('/criar-conta')} />
          <Button title="Já tenho conta" variant="ghost" fullWidth onPress={() => router.push('/entrar')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.xl },
  content: { flex: 1, width: '100%', maxWidth: maxContentWidth / 1.4, alignSelf: 'center', justifyContent: 'space-between', gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.lg },
  features: { gap: spacing.lg },
  feature: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  featureIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, gap: spacing.xxs },
  actions: { gap: spacing.sm },
});
