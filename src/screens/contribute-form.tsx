import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip, ProgressBar } from '@/components/misc';
import { MoneyField } from '@/components/money-field';
import { SheetFrame } from '@/components/sheet-frame';
import { Text } from '@/components/text';
import { useContributeGoal, useGoals } from '@/hooks/queries';
import { ApiError } from '@/lib/api/client';
import { spacing } from '@/theme';
import { centsToAmount, formatMoney } from '@/utils/money';

export function ContributeForm({ goalId }: { goalId: string }) {
  const goal = useGoals().data?.find((g) => g.id === goalId);
  const contribute = useContributeGoal();
  const [cents, setCents] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (cents <= 0) return setError('Informe um valor');
    setError(null);
    try {
      await contribute.mutateAsync({ goalId, amount: centsToAmount(cents) });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível guardar.');
    }
  }

  return (
    <SheetFrame
      title={goal ? `Guardar em “${goal.name}”` : 'Guardar dinheiro'}
      footer={<Button title="Guardar" size="lg" fullWidth loading={contribute.isPending} onPress={save} />}>
      {goal ? (
        <View style={styles.progress}>
          <ProgressBar value={goal.progressPercentage} tone="ai" />
          <Text variant="label" color="textSecondary">
            {formatMoney(goal.savedAmount)} de {formatMoney(goal.targetAmount)}
          </Text>
        </View>
      ) : null}
      <MoneyField label="Valor" large autoFocus cents={cents} onChangeCents={setCents} error={error ?? undefined} />
      <View style={styles.chips}>
        {[50, 100, 200, 500].map((v) => (
          <Chip key={v} label={formatMoney(v)} selected={cents === v * 100} onPress={() => setCents(v * 100)} />
        ))}
      </View>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  progress: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
