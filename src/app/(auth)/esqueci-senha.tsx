import { useLocalSearchParams } from 'expo-router';

import { ForgotPassword } from '@/screens/auth/forgot-password';

export default function ForgotPasswordRoute() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  return <ForgotPassword initialEmail={typeof email === 'string' ? email.slice(0, 254) : undefined} />;
}
