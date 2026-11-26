import { useLocalSearchParams } from 'expo-router';

import { TransactionForm } from '@/screens/transaction-form';

export default function TransactionRoute() {
  const { id, tipo } = useLocalSearchParams<{ id?: string; tipo?: string }>();
  return <TransactionForm id={id} initialType={tipo === 'entrada' ? 'INCOME' : 'EXPENSE'} />;
}
