import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import type { IconName } from '@/components/icon';
import { Chip } from '@/components/misc';
import { MoneyField } from '@/components/money-field';
import { SheetFrame } from '@/components/sheet-frame';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useCreateGoal } from '@/hooks/queries';
import { ApiError } from '@/lib/api/client';
import { spacing } from '@/theme';
import { brDateToIso, maskBrDate, monthsUntil, today } from '@/utils/dates';
import { centsToAmount, formatMoney } from '@/utils/money';

const presets: { label: string; icon: IconName }[] = [
  { label: 'Reserva de emergência', icon: 'shield' },
  { label: 'Carro', icon: 'car' },
  { label: 'Casa', icon: 'home' },
  { label: 'Viagem', icon: 'plane' },
  { label: 'Estudos', icon: 'school' },
];

export function GoalForm() {
  const create = useCreateGoal();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconName>('goals');
  const [cents, setCents] = useState(0);
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const iso = brDateToIso(deadline);
  const perMonth = iso && cents > 0 ? centsToAmount(cents) / monthsUntil(iso) : null;

  async function save() {
    setFormError(null);
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Dê um nome para a meta';
    if (cents <= 0) next.amount = 'Informe o valor';
    if (!iso) next.deadline = 'Data inválida';
    else if (iso <= today()) next.deadline = 'Escolha uma data no futuro';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      await create.mutateAsync({ name: name.trim(), targetAmount: centsToAmount(cents), deadline: iso!, icon });
      router.back();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Não foi possível criar a meta.');
    }
  }

  return (
    <SheetFrame
      title="Nova meta"
      footer={
        <>
          {formError ? (
            <Text variant="label" color="danger">
              {formError}
            </Text>
          ) : null}
          <Button title="Criar meta" size="lg" fullWidth loading={create.isPending} onPress={save} />
        </>
      }>
      <View style={styles.chips}>
        {presets.map((p) => (
          <Chip
            key={p.label}
            label={p.label}
            icon={p.icon}
            selected={name === p.label}
            onPress={() => {
              setName(p.label);
              setIcon(p.icon);
            }}
          />
        ))}
      </View>
      <TextField label="Nome da meta" value={name} onChangeText={setName} maxLength={50} error={errors.name} />
      <MoneyField label="Quanto você quer juntar?" large cents={cents} onChangeCents={setCents} error={errors.amount} />
      <TextField label="Até quando?" placeholder="DD/MM/AAAA" keyboardType="number-pad" value={deadline} onChangeText={(t) => setDeadline(maskBrDate(t))} error={errors.deadline} />
      {perMonth ? (
        <Card tone="aiSoft">
          <Text variant="label" color="ai">
            Plano do Fini
          </Text>
          <Text variant="body">
            Guardando <Text variant="bodyStrong">{formatMoney(perMonth)}</Text> por mês, você chega lá no prazo.
          </Text>
        </Card>
      ) : null}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
