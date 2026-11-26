import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/button';
import { Card } from '@/components/card';
import { Icon } from '@/components/icon';
import { CategoryIcon, EmptyState, ErrorState, LoadingState, SectionTitle, SegmentedControl } from '@/components/misc';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useMonthData } from '@/hooks/queries';
import type { Transaction } from '@/lib/api/types';
import { usePreferences } from '@/lib/preferences';
import { categoryFallbackColors, radius, spacing, useColors } from '@/theme';
import { currentMonth, formatDay, formatMonth, isSameMonth, shiftMonth, type MonthRef } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

type Filter = 'ALL' | 'EXPENSE' | 'INCOME';

export function Sheet() {
  const colors = useColors();
  const { hideValues, setPreference } = usePreferences();
  const [month, setMonth] = useState<MonthRef>(currentMonth);
  const [filter, setFilter] = useState<Filter>('ALL');
  const { summary, byCategory, transactions } = useMonthData(month);

  const refreshing = summary.isRefetching || transactions.isRefetching;
  const refresh = () => {
    void summary.refetch();
    void byCategory.refetch();
    void transactions.refetch();
  };

  const isCurrent = isSameMonth(month, currentMonth());
  const s = summary.data;
  const list = (transactions.data ?? []).filter((t) => filter === 'ALL' || t.type === filter);
  const groups = groupByDay(list);

  return (
    <Screen
      title="Planilha"
      refreshing={refreshing}
      onRefresh={refresh}
      headerRight={
        <View style={styles.headerActions}>
          <IconButton
            icon={hideValues ? 'eyeOff' : 'eye'}
            label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
            variant="muted"
            size={40}
            onPress={() => setPreference('hideValues', !hideValues)}
          />
          <IconButton icon="plus" label="Novo lançamento" variant="filled" size={40} onPress={() => router.push('/transacao')} />
        </View>
      }>
      <View style={styles.monthRow}>
        <IconButton icon="chevronLeft" label="Mês anterior" onPress={() => setMonth((m) => shiftMonth(m, -1))} />
        <Text variant="heading">{formatMonth(month)}</Text>
        <IconButton icon="chevronRight" label="Próximo mês" disabled={isCurrent} onPress={() => setMonth((m) => shiftMonth(m, 1))} />
      </View>

      {summary.isLoading ? (
        <LoadingState />
      ) : summary.isError ? (
        <ErrorState message={summary.error.message} onRetry={refresh} />
      ) : (
        <>
          <Card tone="primarySoft" padding="xl">
            <Text variant="overline" color="primary">
              Saldo do mês
            </Text>
            <Text variant="money" color={(s?.balance ?? 0) < 0 ? 'expense' : 'text'} accessibilityLabel={`Saldo ${formatMoney(s?.balance)}`}>
              {formatMoney(s?.balance, { hidden: hideValues })}
            </Text>
            <View style={styles.tiles}>
              <Tile label="Entradas" value={formatMoney(s?.totalIncome, { hidden: hideValues, compact: true })} tone="income" />
              <Tile label="Gastos" value={formatMoney(s?.totalExpense, { hidden: hideValues, compact: true })} tone="expense" />
            </View>
          </Card>

          {byCategory.data && byCategory.data.categories.length > 0 ? (
            <Card>
              <Text variant="heading">Para onde foi</Text>
              <View style={styles.stack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {byCategory.data.categories.map((c, i) => (
                  <View
                    key={c.categoryId}
                    style={{ flex: Math.max(c.percentage, 1), backgroundColor: validColor(c.categoryColor, i) }}
                  />
                ))}
              </View>
              <View style={styles.catList}>
                {byCategory.data.categories.slice(0, 6).map((c, i) => (
                  <View key={c.categoryId} style={styles.catRow}>
                    <CategoryIcon icon={c.categoryIcon ?? c.categoryName} color={c.categoryColor} index={i} size={32} />
                    <Text variant="body" style={styles.flex} numberOfLines={1}>
                      {c.categoryName}
                    </Text>
                    <Text variant="label" color="textSecondary">
                      {Math.round(c.percentage)}%
                    </Text>
                    <Text variant="bodyStrong" style={styles.amount}>
                      {formatMoney(c.total, { hidden: hideValues })}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}
        </>
      )}

      <SectionTitle>Lançamentos</SectionTitle>
      <SegmentedControl<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'ALL', label: 'Todos' },
          { value: 'EXPENSE', label: 'Gastos' },
          { value: 'INCOME', label: 'Entradas' },
        ]}
      />

      {transactions.isLoading ? (
        <LoadingState />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="receipt"
          title="Nada por aqui ainda"
          message="Adicione um lançamento ou conte para o Fini no chat."
          actionLabel="Adicionar"
          onAction={() => router.push('/transacao')}
        />
      ) : (
        groups.map(([day, items]) => (
          <View key={day} style={styles.group}>
            <Text variant="label" color="textSecondary">
              {formatDay(day)}
            </Text>
            <Card padding="xs" style={styles.groupCard}>
              {items.map((t, idx) => (
                <TransactionRow key={t.id} t={t} hidden={hideValues} last={idx === items.length - 1} borderColor={colors.border} />
              ))}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: 'income' | 'expense' }) {
  const colors = useColors();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surface }]}>
      <View style={styles.tileHead}>
        <Icon name={tone === 'income' ? 'income' : 'expense'} size={14} color={colors[tone]} />
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
      </View>
      <Text variant="heading" color={tone}>
        {value}
      </Text>
    </View>
  );
}

function TransactionRow({ t, hidden, last, borderColor }: { t: Transaction; hidden: boolean; last: boolean; borderColor: string }) {
  const income = t.type === 'INCOME';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.description || t.category.name}, ${income ? 'entrada' : 'gasto'} de ${formatMoney(t.amount)}`}
      onPress={() => router.push({ pathname: '/transacao', params: { id: t.id } })}
      style={({ pressed }) => [
        styles.txRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor },
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <CategoryIcon icon={t.category.icon ?? t.category.name} color={t.category.color} size={36} fallback={income ? 'money' : 'wallet'} />
      <View style={styles.flex}>
        <Text variant="body" numberOfLines={1}>
          {t.description || t.category.name}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {t.category.name}
          {t.source === 'AI' || t.source === 'OCR' ? ' · pelo Fini' : ''}
        </Text>
      </View>
      <Text variant="bodyStrong" color={income ? 'income' : 'text'}>
        {income ? '+' : '−'} {formatMoney(t.amount, { hidden })}
      </Text>
    </Pressable>
  );
}

function groupByDay(list: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>();
  for (const t of list) {
    const key = t.transactionDate.slice(0, 10);
    map.set(key, [...(map.get(key) ?? []), t]);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

function validColor(c: string | null | undefined, i: number) {
  return c && /^#[0-9a-f]{6}$/i.test(c) ? c : categoryFallbackColors[i % categoryFallbackColors.length];
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tiles: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  tile: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderCurve: 'continuous', gap: spacing.xs },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stack: { flexDirection: 'row', height: 12, borderRadius: radius.full, overflow: 'hidden', gap: 2 },
  catList: { gap: spacing.md },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  amount: { minWidth: 90, textAlign: 'right' },
  group: { gap: spacing.sm },
  groupCard: { gap: 0, paddingHorizontal: spacing.md },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
});
