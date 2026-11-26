import { router } from 'expo-router';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Button, IconButton } from '@/components/button';
import { Card } from '@/components/card';
import { CategoryIcon, EmptyState, ErrorState, LoadingState, ProgressBar } from '@/components/misc';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useDeleteGoal, useGoals } from '@/hooks/queries';
import type { Goal } from '@/lib/api/types';
import { usePreferences } from '@/lib/preferences';
import { spacing } from '@/theme';
import { formatFullDate, monthsUntil } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

export function Goals() {
  const goals = useGoals();
  const { hideValues } = usePreferences();
  const list = goals.data ?? [];
  const active = list.filter((g) => g.status !== 'COMPLETED' && g.status !== 'ARCHIVED');
  const done = list.filter((g) => g.status === 'COMPLETED');
  const totalSaved = list.reduce((s, g) => s + g.savedAmount, 0);

  return (
    <Screen
      title="Metas"
      subtitle={list.length ? `${formatMoney(totalSaved, { hidden: hideValues })} guardados no total` : undefined}
      refreshing={goals.isRefetching}
      onRefresh={() => void goals.refetch()}
      headerRight={<IconButton icon="plus" label="Nova meta" variant="filled" size={40} onPress={() => router.push('/meta')} />}>
      {goals.isLoading ? (
        <LoadingState />
      ) : goals.isError ? (
        <ErrorState message={goals.error.message} onRetry={() => void goals.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="goals"
          title="Qual é o seu próximo sonho?"
          message="Crie uma meta e o Fini calcula quanto guardar por mês para chegar lá."
          actionLabel="Criar meta"
          onAction={() => router.push('/meta')}
        />
      ) : (
        <>
          {active.map((g, i) => (
            <GoalCard key={g.id} goal={g} index={i} hidden={hideValues} />
          ))}
          {done.length ? (
            <>
              <Text variant="overline" color="textSecondary">
                Conquistadas
              </Text>
              {done.map((g, i) => (
                <GoalCard key={g.id} goal={g} index={i} hidden={hideValues} />
              ))}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function GoalCard({ goal, index, hidden }: { goal: Goal; index: number; hidden: boolean }) {
  const remove = useDeleteGoal();
  const completed = goal.status === 'COMPLETED';
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const perMonth = remaining / monthsUntil(goal.deadline);

  const confirmDelete = () => {
    const run = () => void remove.mutateAsync(goal.id).catch(() => undefined);
    if (Platform.OS === 'web') return run();
    Alert.alert(`Excluir “${goal.name}”?`, 'O histórico de aportes desta meta será perdido.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Card>
      <View style={styles.head}>
        <CategoryIcon icon={goal.icon ?? goal.name} index={index + 1} size={44} fallback="goals" />
        <View style={styles.flex}>
          <Text variant="heading" numberOfLines={1}>
            {goal.name}
          </Text>
          <Text variant="caption" color="textSecondary">
            {completed ? 'Meta conquistada!' : `Até ${formatFullDate(goal.deadline)}`}
          </Text>
        </View>
        <IconButton icon="trash" label={`Excluir meta ${goal.name}`} size={36} onPress={confirmDelete} />
      </View>

      <View style={styles.amounts}>
        <Text variant="money" style={styles.saved}>
          {formatMoney(goal.savedAmount, { hidden })}
        </Text>
        <Text variant="label" color="textSecondary">
          de {formatMoney(goal.targetAmount, { hidden })}
        </Text>
      </View>
      <ProgressBar value={goal.progressPercentage} tone={completed ? 'primary' : 'ai'} />
      <View style={styles.foot}>
        <Text variant="label" color="textSecondary" style={styles.flex}>
          {completed
            ? `${Math.round(goal.progressPercentage)}% concluído`
            : `${Math.round(goal.progressPercentage)}% · guarde ${formatMoney(perMonth, { hidden })}/mês`}
        </Text>
        {!completed ? (
          <Button title="Guardar" size="sm" icon="plus" onPress={() => router.push({ pathname: '/aporte', params: { id: goal.id } })} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  amounts: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' },
  saved: { fontSize: 24, lineHeight: 30 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
