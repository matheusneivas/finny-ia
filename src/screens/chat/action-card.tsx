import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/text';
import {
  useCategories,
  useContributeGoal,
  useCreateGoal,
  useCreateTransaction,
  useDeleteTransaction,
  useGoals,
  useUpdateTransaction,
} from '@/hooks/queries';
import { ApiError } from '@/lib/api/client';
import type { ProposedAction } from '@/lib/api/types';
import { radius, spacing, useColors } from '@/theme';
import { formatFullDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

export type ActionState = 'pending' | 'saving' | 'done' | 'dismissed';

const meta: Record<ProposedAction['type'], { icon: IconName; title: string; confirm: string }> = {
  CREATE_TRANSACTION: { icon: 'receipt', title: 'Novo lançamento', confirm: 'Salvar' },
  UPDATE_TRANSACTION: { icon: 'edit', title: 'Alterar lançamento', confirm: 'Alterar' },
  DELETE_TRANSACTION: { icon: 'trash', title: 'Excluir lançamento', confirm: 'Excluir' },
  CREATE_GOAL: { icon: 'goals', title: 'Nova meta', confirm: 'Criar meta' },
  CONTRIBUTE_GOAL: { icon: 'savings', title: 'Guardar dinheiro', confirm: 'Confirmar' },
};

function Row({ label, value, tone }: { label: string; value: string; tone?: 'income' | 'expense' }) {
  return (
    <View style={styles.row}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyStrong" color={tone ?? 'text'} numberOfLines={1} style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Cartão de confirmação: a IA só PROPÕE. Nada é salvo até o usuário tocar
 * em confirmar; aí o app chama os endpoints normais da API.
 */
export function ActionCard({
  action,
  state,
  onStateChange,
}: {
  action: ProposedAction;
  state: ActionState;
  onStateChange: (s: ActionState) => void;
}) {
  const colors = useColors();
  const [error, setError] = useState<string | null>(null);
  const categories = useCategories();
  const goals = useGoals();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const createGoal = useCreateGoal();
  const contribute = useContributeGoal();
  const m = meta[action.type];

  const categoryName = (id?: string) => categories.data?.find((c) => c.id === id)?.name ?? '—';

  // Evita salvar duas vezes com toques rápidos (antes do estado atualizar).
  const busy = useRef(false);

  async function confirm() {
    if (busy.current || state !== 'pending') return;
    busy.current = true;
    setError(null);
    onStateChange('saving');
    try {
      switch (action.type) {
        case 'CREATE_TRANSACTION':
          await createTx.mutateAsync({ ...action.payload, idempotencyKey: action.id });
          break;
        case 'UPDATE_TRANSACTION': {
          const { transactionId, ...input } = action.payload;
          await updateTx.mutateAsync({ id: transactionId, input });
          break;
        }
        case 'DELETE_TRANSACTION':
          await deleteTx.mutateAsync(action.payload.transactionId);
          break;
        case 'CREATE_GOAL':
          await createGoal.mutateAsync({ ...action.payload, idempotencyKey: action.id });
          break;
        case 'CONTRIBUTE_GOAL':
          await contribute.mutateAsync({ ...action.payload, idempotencyKey: action.id });
          break;
      }
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onStateChange('done');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
      onStateChange('pending');
    } finally {
      busy.current = false;
    }
  }

  function edit() {
    if (action.type !== 'CREATE_TRANSACTION') return;
    router.push({ pathname: '/transacao', params: { rascunho: JSON.stringify(action.payload) } });
    onStateChange('dismissed');
  }

  let rows: React.ReactNode = null;
  if (action.type === 'CREATE_TRANSACTION' || action.type === 'UPDATE_TRANSACTION') {
    const p = action.payload;
    rows = (
      <>
        <Row label="Valor" value={formatMoney(p.amount)} tone={p.type === 'INCOME' ? 'income' : 'expense'} />
        <Row label="Tipo" value={p.type === 'INCOME' ? 'Entrada' : 'Gasto'} />
        <Row label="Categoria" value={categoryName(p.categoryId)} />
        {p.description ? <Row label="Descrição" value={p.description} /> : null}
        <Row label="Data" value={formatFullDate(p.transactionDate)} />
      </>
    );
  } else if (action.type === 'CREATE_GOAL') {
    const p = action.payload;
    rows = (
      <>
        <Row label="Meta" value={p.name} />
        <Row label="Valor" value={formatMoney(p.targetAmount)} />
        <Row label="Até" value={formatFullDate(p.deadline)} />
      </>
    );
  } else if (action.type === 'CONTRIBUTE_GOAL') {
    const goal = goals.data?.find((g) => g.id === action.payload.goalId);
    rows = (
      <>
        <Row label="Meta" value={goal?.name ?? '—'} />
        <Row label="Valor" value={formatMoney(action.payload.amount)} tone="income" />
      </>
    );
  }

  const done = state === 'done';
  const dismissed = state === 'dismissed';
  const danger = action.type === 'DELETE_TRANSACTION';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: done ? colors.primary : colors.border, opacity: dismissed ? 0.55 : 1 },
      ]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: danger ? colors.expenseSoft : colors.aiSoft }]}>
          <Icon name={m.icon} size={16} color={danger ? colors.danger : colors.ai} />
        </View>
        <View style={styles.flex}>
          <Text variant="overline" color="textSecondary">
            {m.title}
          </Text>
          <Text variant="bodyStrong">{action.summary ?? m.title}</Text>
        </View>
      </View>

      <View style={[styles.rows, { borderColor: colors.border }]}>{rows}</View>

      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}

      {done ? (
        <View style={styles.status}>
          <Icon name="check" size={16} color={colors.primary} />
          <Text variant="label" color="primary">
            {danger ? 'Excluído' : 'Salvo'}
          </Text>
        </View>
      ) : dismissed ? (
        <Text variant="label" color="textMuted">
          Descartado
        </Text>
      ) : (
        <View style={styles.actions}>
          <Button
            title={m.confirm}
            size="sm"
            variant={danger ? 'danger' : 'primary'}
            icon="check"
            loading={state === 'saving'}
            onPress={confirm}
            style={styles.flex}
          />
          {action.type === 'CREATE_TRANSACTION' ? (
            <Button title="Editar" size="sm" variant="secondary" onPress={edit} disabled={state === 'saving'} />
          ) : null}
          <Button title="Descartar" size="sm" variant="ghost" onPress={() => onStateChange('dismissed')} disabled={state === 'saving'} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
    maxWidth: 380,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  rows: { gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
