import { useLocalSearchParams } from 'expo-router';

import { ContributeForm } from '@/screens/contribute-form';

export default function ContributeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ContributeForm goalId={id} />;
}
