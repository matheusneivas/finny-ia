import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FiniMark } from '@/components/brand';
import { Button, IconButton } from '@/components/button';
import { Chip, ProgressBar } from '@/components/misc';
import { MoneyField } from '@/components/money-field';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { ApiError } from '@/lib/api/client';
import { onboardingApi } from '@/lib/api/endpoints';
import type { CommunicationStyle, FinancialKnowledgeLevel, IncomeRange } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { maxContentWidth, spacing, useColors } from '@/theme';
import { brDateToIso, maskBrDate } from '@/utils/dates';
import { centsToAmount } from '@/utils/money';

const incomeOptions: { value: IncomeRange; label: string }[] = [
  { value: 'UNDER_2K', label: 'Até R$ 2 mil' },
  { value: 'RANGE_2K_5K', label: 'R$ 2 a 5 mil' },
  { value: 'RANGE_5K_10K', label: 'R$ 5 a 10 mil' },
  { value: 'RANGE_10K_20K', label: 'R$ 10 a 20 mil' },
  { value: 'OVER_20K', label: 'Mais de R$ 20 mil' },
];

const goalOptions = ['Sair das dívidas', 'Reserva de emergência', 'Comprar um carro', 'Comprar uma casa', 'Viajar', 'Investir mais'];

const knowledgeOptions: { value: FinancialKnowledgeLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Estou começando' },
  { value: 'INTERMEDIATE', label: 'Me viro bem' },
  { value: 'ADVANCED', label: 'Manjo muito' },
];

const styleOptions: { value: CommunicationStyle; label: string }[] = [
  { value: 'FRIENDLY', label: 'Leve e amigável' },
  { value: 'DIRECT', label: 'Direto ao ponto' },
  { value: 'FORMAL', label: 'Mais formal' },
];

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.chips}>
      <Chip label="Sim" selected={value === true} onPress={() => onChange(true)} />
      <Chip label="Não" selected={value === false} onPress={() => onChange(false)} />
    </View>
  );
}

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.question}>
      <Text variant="bodyStrong">{title}</Text>
      {children}
    </View>
  );
}

/**
 * Onboarding em 5 passos curtos (mesmos endpoints da API).
 * SUPOSIÇÃO: não pedimos CPF (o app não usa; minimização de dados/LGPD).
 * A API atual exige CPF no passo 1 — combinado com a thread da API torná-lo opcional.
 */
export function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, markOnboardingDone, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [birth, setBirth] = useState('');
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState<IncomeRange | null>(null);
  const [paysRent, setPaysRent] = useState<boolean | null>(null);
  const [rentCents, setRentCents] = useState(0);
  const [hasDebts, setHasDebts] = useState<boolean | null>(null);
  const [debtCents, setDebtCents] = useState(0);
  const [hasFund, setHasFund] = useState<boolean | null>(null);
  const [invests, setInvests] = useState<boolean | null>(null);
  const [investCents, setInvestCents] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [knowledge, setKnowledge] = useState<FinancialKnowledgeLevel | null>(null);
  const [tone, setTone] = useState<CommunicationStyle>('FRIENDLY');

  const birthIso = brDateToIso(birth);

  const steps = [
    {
      title: `Prazer, ${user?.name?.split(' ')[0] || 'tudo bem'}! Eu sou o Finny.`,
      subtitle: 'Algumas perguntas rápidas para eu te ajudar do jeito certo.',
      valid: !!birthIso,
      body: (
        <>
          <TextField
            label="Data de nascimento"
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            value={birth}
            onChangeText={(t) => setBirth(maskBrDate(t))}
            error={birth.length === 10 && !birthIso ? 'Data inválida' : undefined}
          />
          <TextField label="Profissão (opcional)" value={occupation} onChangeText={setOccupation} maxLength={80} />
        </>
      ),
      send: () => onboardingApi.step(1, { birthDate: birthIso, occupation: occupation.trim() || undefined }),
    },
    {
      title: 'Sobre sua renda',
      subtitle: 'Só uma faixa, sem valor exato.',
      valid: !!income && paysRent !== null,
      body: (
        <>
          <Question title="Quanto entra por mês, mais ou menos?">
            <View style={styles.chips}>
              {incomeOptions.map((o) => (
                <Chip key={o.value} label={o.label} selected={income === o.value} onPress={() => setIncome(o.value)} />
              ))}
            </View>
          </Question>
          <Question title="Você paga aluguel?">
            <YesNo value={paysRent} onChange={setPaysRent} />
          </Question>
          {paysRent ? <MoneyField label="Valor do aluguel" cents={rentCents} onChangeCents={setRentCents} /> : null}
        </>
      ),
      send: () =>
        onboardingApi.step(2, { incomeRange: income, paysRent, monthlyRent: paysRent ? centsToAmount(rentCents) : undefined }),
    },
    {
      title: 'Dívidas e reserva',
      subtitle: 'Sem julgamento, é para montar o melhor plano.',
      valid: hasDebts !== null && hasFund !== null,
      body: (
        <>
          <Question title="Você tem dívidas hoje?">
            <YesNo value={hasDebts} onChange={setHasDebts} />
          </Question>
          {hasDebts ? <MoneyField label="Total aproximado" cents={debtCents} onChangeCents={setDebtCents} /> : null}
          <Question title="Tem uma reserva de emergência?">
            <YesNo value={hasFund} onChange={setHasFund} />
          </Question>
        </>
      ),
      send: () =>
        onboardingApi.step(3, { hasDebts, totalDebt: hasDebts ? centsToAmount(debtCents) : undefined, hasEmergencyFund: hasFund }),
    },
    {
      title: 'Investimentos',
      subtitle: 'Quanto você gostaria de separar por mês?',
      valid: invests !== null,
      body: (
        <>
          <Question title="Você já investe?">
            <YesNo value={invests} onChange={setInvests} />
          </Question>
          <MoneyField label="Quero guardar por mês" cents={investCents} onChangeCents={setInvestCents} />
        </>
      ),
      send: () => onboardingApi.step(4, { hasInvestments: invests, monthlyInvestmentGoal: centsToAmount(investCents) }),
    },
    {
      title: 'Seus objetivos',
      subtitle: 'Escolha o que mais importa agora.',
      valid: goals.length > 0 && !!knowledge,
      body: (
        <>
          <Question title="O que você quer conquistar?">
            <View style={styles.chips}>
              {goalOptions.map((g) => (
                <Chip
                  key={g}
                  label={g}
                  selected={goals.includes(g)}
                  onPress={() => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))}
                />
              ))}
            </View>
          </Question>
          <Question title="Quanto você entende de finanças?">
            <View style={styles.chips}>
              {knowledgeOptions.map((o) => (
                <Chip key={o.value} label={o.label} selected={knowledge === o.value} onPress={() => setKnowledge(o.value)} />
              ))}
            </View>
          </Question>
          <Question title="Como prefere que eu fale com você?">
            <View style={styles.chips}>
              {styleOptions.map((o) => (
                <Chip key={o.value} label={o.label} selected={tone === o.value} onPress={() => setTone(o.value)} />
              ))}
            </View>
          </Question>
        </>
      ),
      send: () =>
        onboardingApi.step(5, {
          shortTermGoals: goals,
          primaryGoal: goals[0],
          knowledgeLevel: knowledge,
          communicationStyle: tone,
          expenseControlPreference: 'MIXED',
          reportFrequency: 'WEEKLY',
        }),
    },
  ];

  const current = steps[step - 1];

  async function next() {
    setError(null);
    setLoading(true);
    try {
      await current.send();
      if (step === steps.length) markOnboardingDone();
      else setStep(step + 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível salvar. Tente de novo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.top}>
          <IconButton
            icon={step === 1 ? 'logout' : 'chevronLeft'}
            label={step === 1 ? 'Sair' : 'Voltar'}
            onPress={() => (step === 1 ? void signOut() : setStep(step - 1))}
          />
          <View style={styles.flex}>
            <ProgressBar value={(step / steps.length) * 100} height={6} />
          </View>
          <Text variant="label" color="textSecondary">
            {step}/{steps.length}
          </Text>
        </View>

        <View style={styles.header}>
          {step === 1 ? <FiniMark size={48} /> : null}
          <Text variant="title">{current.title}</Text>
          <Text variant="body" color="textSecondary">
            {current.subtitle}
          </Text>
        </View>

        <View style={styles.body}>{current.body}</View>

        {error ? (
          <Text variant="label" color="danger">
            {error}
          </Text>
        ) : null}
        <Button
          title={step === steps.length ? 'Começar a usar' : 'Continuar'}
          size="lg"
          fullWidth
          disabled={!current.valid}
          loading={loading}
          onPress={next}
        />
        <Text variant="caption" color="textMuted" align="center">
          Usamos essas respostas só para personalizar as dicas. Você pode mudar tudo depois no Perfil.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: maxContentWidth / 1.3, alignSelf: 'center', paddingHorizontal: spacing.xl, gap: spacing.xl },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginLeft: -spacing.md },
  header: { gap: spacing.sm },
  body: { gap: spacing.xl },
  question: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
