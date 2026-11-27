import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Icon, type IconName } from '@/components/icon';
import { closeSheet, SheetFrame } from '@/components/sheet-frame';
import { Text } from '@/components/text';
import { SHORTCUTS, shortcutTarget, shortcutUrl, type ShortcutId } from '@/lib/shortcuts';
import { radius, spacing, useColors } from '@/theme';

const shortcutIcon: Record<ShortcutId, IconName> = {
  'novo-gasto': 'expense',
  'nova-entrada': 'income',
  guardar: 'savings',
  chat: 'chat',
};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.step}>
      <View style={[styles.stepNum, { backgroundColor: colors.aiSoft }]}>
        <Text variant="caption" color="ai">
          {n}
        </Text>
      </View>
      <Text variant="label" style={styles.flex}>
        {children}
      </Text>
    </View>
  );
}

/** Explica e testa os atalhos: links diretos, Siri / app Atalhos, ícone e widget. */
export function ShortcutsScreen() {
  const colors = useColors();
  const [copied, setCopied] = useState<string | null>(null);
  const sirilink = shortcutUrl('novo-gasto', { valor: 'VALOR' });

  async function copy(key: string, text: string) {
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
  }

  function open(id: ShortcutId) {
    const target = shortcutTarget(id, {});
    closeSheet();
    if (target !== '/') setTimeout(() => router.push(target), 50);
  }

  return (
    <SheetFrame title="Atalhos">
      <Text variant="body" color="textSecondary">
        Anote um gasto em segundos, sem procurar nada no app. Cada atalho tem um link que funciona na Siri, no app Atalhos do iPhone e no widget.
      </Text>

      <Card padding="md">
        {SHORTCUTS.map((s, i) => {
          const url = shortcutUrl(s.id);
          return (
            <View key={s.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${s.title}`}
                onPress={() => open(s.id)}
                style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.6 : 1 }]}>
                <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
                  <Icon name={shortcutIcon[s.id]} size={18} color={colors.textSecondary} />
                </View>
                <View style={styles.flex}>
                  <Text variant="bodyStrong">{s.title}</Text>
                  <Text variant="caption" color="textSecondary" numberOfLines={1} ellipsizeMode="middle">
                    {url}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Copiar link de ${s.title}`}
                hitSlop={8}
                onPress={() => void copy(s.id, url)}
                style={({ pressed }) => [styles.copy, { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.6 : 1 }]}>
                <Text variant="caption" color={copied === s.id ? 'primary' : 'textSecondary'}>
                  {copied === s.id ? 'Copiado' : 'Copiar'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </Card>

      {Platform.OS === 'ios' ? (
        <>
          <Text variant="overline" color="textSecondary">
            “E aí Siri, gastei no Fini”
          </Text>
          <Card padding="lg" style={styles.steps}>
            <Step n={1}>Abra o app Atalhos e toque em + para criar um atalho.</Step>
            <Step n={2}>Adicione a ação “Pedir Entrada”, do tipo Número, com a pergunta “Quanto você gastou?”.</Step>
            <Step n={3}>Adicione a ação “Abrir URL” e cole o link abaixo. Troque VALOR pela variável “Entrada fornecida”.</Step>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copiar link para a Siri"
              onPress={() => void copy('siri', sirilink)}
              style={({ pressed }) => [styles.code, { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.7 : 1 }]}>
              <Text variant="caption" style={styles.flex} numberOfLines={2}>
                {sirilink}
              </Text>
              <Text variant="caption" color={copied === 'siri' ? 'primary' : 'ai'}>
                {copied === 'siri' ? 'Copiado' : 'Copiar'}
              </Text>
            </Pressable>
            <Step n={4}>Dê o nome “Gastei no Fini”. Pronto: fale com a Siri, diga o valor e o Fini abre com ele preenchido. Você só confere e salva.</Step>
          </Card>
        </>
      ) : null}

      <Text variant="overline" color="textSecondary">
        No app instalado
      </Text>
      <Card padding="lg" style={styles.steps}>
        <Text variant="label">
          <Text variant="label" style={styles.bold}>
            Segurar o ícone do Fini:{' '}
          </Text>
          aparecem Novo gasto, Nova entrada, Guardar na meta e Falar com o Fini.
          {Platform.OS === 'android' ? ' Dá para arrastar um deles para a tela inicial.' : ''}
        </Text>
        <Text variant="label">
          <Text variant="label" style={styles.bold}>
            Widget:{' '}
          </Text>
          mostra o saldo do mês e sua meta. No iPhone, o widget médio tem os botões Gasto, Entrada e Guardar. No modo discreto os valores ficam escondidos.
        </Text>
        <Text variant="caption" color="textMuted">
          Ícone e widget só aparecem na versão instalada do app, não no Expo Go.
        </Text>
      </Card>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 },
  icon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  copy: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  steps: { gap: spacing.md },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  code: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.sm },
});
