import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/button';
import { resolveIcon } from '@/components/icon';
import { Chip, ErrorState, LoadingState, SegmentedControl } from '@/components/misc';
import { MoneyField } from '@/components/money-field';
import { SheetFrame } from '@/components/sheet-frame';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useCategories, useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from '@/hooks/queries';
import { ApiError } from '@/lib/api/client';
import { transactionsApi } from '@/lib/api/endpoints';
import type { ExpenseFrequency, Transaction, TransactionInput, TransactionType } from '@/lib/api/types';
import { spacing } from '@/theme';
import { brDateToIso, isoToBrDate, maskBrDate, today, yesterday as getYesterday } from '@/utils/dates';
import { amountToCents, centsToAmount } from '@/utils/money';

/** Rascunho vindo do chat (via parâmetro de rota) é validado antes de usar. */
const draftSchema = z.object({
  amount: z.number().positive().max(1e9),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().max(64),
  description: z.string().max(200).optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function parseDraft(raw?: string): Partial<TransactionInput> | null {
  if (!raw) return null;
  try {
    const r = draftSchema.safeParse(JSON.parse(raw));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export function TransactionForm({ id, initialType }: { id?: string; initialType: TransactionType }) {
  const { rascunho } = useLocalSearchParams<{ rascunho?: string }>();
  const draft = useMemo(() => parseDraft(rascunho), [rascunho]);
  const existing = useQuery({ queryKey: ['transaction', id], queryFn: () => transactionsApi.get(id!), enabled: !!id });

  if (id && existing.isLoading) {
    return (
      <SheetFrame title="Lançamento">
        <LoadingState />
      </SheetFrame>
    );
  }
  if (id && existing.isError) {
    return (
      <SheetFrame title="Lançamento">
        <ErrorState message={existing.error.message} onRetry={() => void existing.refetch()} />
      </SheetFrame>
    );
  }
  return <Form key={id ?? 'new'} id={id} existing={existing.data} draft={draft} initialType={initialType} />;
}

function Form({
  id,
  existing,
  draft,
  initialType,
}: {
  id?: string;
  existing?: Transaction;
  draft: Partial<TransactionInput> | null;
  initialType: TransactionType;
}) {
  const editing = !!id;
  const start = existing
    ? { type: existing.type, amount: existing.amount, description: existing.description ?? '', categoryId: existing.category.id, date: existing.transactionDate }
    : { type: draft?.type ?? initialType, amount: draft?.amount ?? 0, description: draft?.description ?? '', categoryId: draft?.categoryId ?? null, date: draft?.transactionDate ?? today() };

  const [type, setType] = useState<TransactionType>(start.type);
  const [cents, setCents] = useState(amountToCents(start.amount));
  const [description, setDescription] = useState(start.description);
  const [categoryId, setCategoryId] = useState<string | null>(start.categoryId);
  const [date, setDate] = useState(isoToBrDate(start.date));
  const [frequency, setFrequency] = useState<ExpenseFrequency>(existing?.frequency ?? 'ONCE');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [yesterday] = useState(getYesterday);

  const categories = useCategories(type);
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();
  const saving = create.isPending || update.isPending;


  async function save() {
    setFormError(null);
    const iso = brDateToIso(date);
    const next: Record<string, string> = {};
    if (cents <= 0) next.amount = 'Informe um valor';
    if (!categoryId) next.category = 'Escolha uma categoria';
    if (!iso) next.date = 'Data inválida';
    setErrors(next);
    if (Object.keys(next).length) return;

    const input: TransactionInput = {
      amount: centsToAmount(cents),
      type,
      categoryId: categoryId!,
      description: description.trim() || undefined,
      transactionDate: iso!,
      frequency,
      repeatCount: frequency === 'ONCE' ? undefined : 12,
    };
    try {
      if (editing) await update.mutateAsync({ id: id!, input });
      else await create.mutateAsync(input);
      router.back();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    }
  }

  function confirmDelete() {
    const run = async () => {
      try {
        await remove.mutateAsync(id!);
        router.back();
      } catch (e) {
        setFormError(e instanceof ApiError ? e.message : 'Não foi possível excluir.');
      }
    };
    if (Platform.OS === 'web') return void run();
    Alert.alert('Excluir lançamento?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => void run() },
    ]);
  }

  return (
    <SheetFrame
      title={editing ? 'Editar lançamento' : 'Novo lançamento'}
      footer={
        <>
          {formError ? (
            <Text variant="label" color="danger">
              {formError}
            </Text>
          ) : null}
          <Button title={editing ? 'Salvar alterações' : 'Salvar'} size="lg" fullWidth loading={saving} onPress={save} />
          {editing ? <Button title="Excluir" variant="danger" fullWidth icon="trash" loading={remove.isPending} onPress={confirmDelete} /> : null}
        </>
      }>
      <SegmentedControl<TransactionType>
        value={type}
        onChange={(t) => {
          setType(t);
          setCategoryId(null);
        }}
        options={[
          { value: 'EXPENSE', label: 'Gasto' },
          { value: 'INCOME', label: 'Entrada' },
        ]}
      />
      <MoneyField label="Valor" large cents={cents} onChangeCents={setCents} error={errors.amount} autoFocus={!editing && !draft} />
      <TextField label="Descrição" placeholder={type === 'EXPENSE' ? 'Ex.: Almoço com a equipe' : 'Ex.: Salário'} value={description} onChangeText={setDescription} maxLength={200} />

      <View style={styles.block}>
        <Text variant="label" color="textSecondary">
          Categoria
        </Text>
        {categories.isLoading ? (
          <LoadingState />
        ) : (
          <View style={styles.chips}>
            {(categories.data ?? []).map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                icon={resolveIcon(c.icon ?? c.name)}
                selected={categoryId === c.id}
                onPress={() => setCategoryId(c.id)}
              />
            ))}
          </View>
        )}
        {errors.category ? (
          <Text variant="caption" color="danger">
            {errors.category}
          </Text>
        ) : null}
      </View>

      <View style={styles.block}>
        <TextField label="Data" placeholder="DD/MM/AAAA" keyboardType="number-pad" value={date} onChangeText={(t) => setDate(maskBrDate(t))} error={errors.date} />
        <View style={styles.chips}>
          <Chip label="Hoje" selected={brDateToIso(date) === today()} onPress={() => setDate(isoToBrDate(today()))} />
          <Chip label="Ontem" selected={brDateToIso(date) === yesterday} onPress={() => setDate(isoToBrDate(yesterday))} />
        </View>
      </View>

      {!editing ? (
        <View style={styles.block}>
          <Text variant="label" color="textSecondary">
            Repete?
          </Text>
          <View style={styles.chips}>
            <Chip label="Só uma vez" selected={frequency === 'ONCE'} onPress={() => setFrequency('ONCE')} />
            <Chip label="Todo mês" selected={frequency === 'MONTHLY'} onPress={() => setFrequency('MONTHLY')} />
            <Chip label="Toda semana" selected={frequency === 'WEEKLY'} onPress={() => setFrequency('WEEKLY')} />
          </View>
        </View>
      ) : null}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
