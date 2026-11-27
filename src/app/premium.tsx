import { useLocalSearchParams } from 'expo-router';

import { PremiumScreen } from '@/screens/premium';

/**
 * Tela do Premium. No site, é também a página de volta do checkout do Mercado Pago
 * (BILLING_RETURN_URL = https://<site>/premium).
 */
export default function PremiumRoute() {
  const { motivo } = useLocalSearchParams<{ motivo?: string }>();
  return <PremiumScreen reason={motivo} />;
}
