import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip, EmptyState, LoadingState, ProgressBar } from '@/components/misc';
import { MoneyField } from '@/components/money-field';
import { closeSheet, SheetFrame } from '@/components/sheet-frame';
import { Text } from '@/components/text';
import { useContributeGoal, useGoals } from '@/hooks/queries';
import { ApiError } from '@/lib/api/client';
import { spacing } from '@/theme';
import { amountToCents, centsToAmount, formatMoney } from '@/utils/money';

/**
 * Guardar dinheiro numa meta. Sem meta definida (atalho "Guardar na meta"),
 * mostra as metas ativas para escolher, começando pela mais perto do fim.
 */
export function ContributeForm({ goalId, initialAmount }: { goalId?: string; initialAmount?: number | null }) {
  const goals = useGoals();
  const active = (goals.data ?? []).filter((g) => g.status === 'ACTIVE');
  const [picked, setPicked] = useState<string | null>(goalId ?? null);
  const selectedId = picked ?? active[0]?.id ?? null;
  const goal = goals.data?.find((g) => g.id === selectedId);
  const contribute = useContributeGoal();
  const [cents, setCents] = useState(initialAmount ? amountToCents(initialAmount) : 0);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!selectedId) return setError('Escolha uma meta');
    if (cents <= 0) return setError('Informe um valor');
    setError(null);
    try {
      await contribute.mutateAsync({ goalId: selectedId, amount: centsToAmount(cents) });
      closeSheet();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível guardar.');
    }
  }

  if (!goalId && goals.isLoading) {
    return (
      <SheetFrame title="Guardar dinheiro">
        <LoadingState />
      </SheetFrame>
    );
  }

  if (!goalId && goals.isSuccess && active.length === 0) {
    return (
      <SheetFrame title="Guardar dinheiro">
        <EmptyState
          icon="goals"
          title="Você ainda não tem metas"
          message="Crie uma meta e depois é só guardar por aqui."
          actionLabel="Criar meta"
          onAction={() => router.replace('/meta')}
        />
      </SheetFrame>
    );
  }

  return (
    <SheetFrame
      title={goal ? `Guardar em “${goal.name}”` : 'Guardar dinheiro'}
      footer={<Button title="Guardar" size="lg" fullWidth loading={contribute.isPending} onPress={save} />}>
      {!goalId && active.length > 1 ? (
        <View style={styles.picker}>
          <Text variant="label" color="textSecondary">
            Em qual meta?
          </Text>
          <View style={styles.chips}>
            {active.map((g) => (
              <Chip key={g.id} label={g.name} selected={g.id === selectedId} onPress={() => setPicked(g.id)} />
            ))}
          </View>
        </View>
      ) : null}
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
  picker: { gap: spacing.sm },
  progress: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
