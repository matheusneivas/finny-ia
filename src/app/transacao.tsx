import { useLocalSearchParams } from 'expo-router';

import { parseAmountParam, parseTextParam } from '@/lib/shortcuts';
import { TransactionForm } from '@/screens/transaction-form';

export default function TransactionRoute() {
  const { id, tipo, valor, descricao } = useLocalSearchParams<{ id?: string; tipo?: string; valor?: string; descricao?: string }>();
  // Valor e descrição podem vir de um atalho (Siri, widget): só preenchem o formulário.
  const amount = parseAmountParam(valor);
  const description = parseTextParam(descricao);
  const prefill = amount || description ? { ...(amount ? { amount } : {}), ...(description ? { description } : {}) } : null;
  return <TransactionForm id={id} initialType={tipo === 'entrada' ? 'INCOME' : 'EXPENSE'} prefill={prefill} />;
}
