import { useLocalSearchParams } from 'expo-router';

import { parseAmountParam } from '@/lib/shortcuts';
import { ContributeForm } from '@/screens/contribute-form';

export default function ContributeRoute() {
  const { id, valor } = useLocalSearchParams<{ id?: string; valor?: string }>();
  return <ContributeForm goalId={id} initialAmount={parseAmountParam(valor)} />;
}
