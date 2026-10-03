import { Redirect } from 'expo-router';
import { AppLoadingState } from '@/components/ui/AppLoadingState';
import { useAuth } from '@/auth/AuthProvider';

export default function Index() {
  const { status } = useAuth();
  if (status === 'AUTHENTICATING') return <AppLoadingState />;
  if (status === 'AUTHENTICATED') return <Redirect href="/(app)/(tabs)" />;
  if (status === 'PROFILE_INCOMPLETE') return <Redirect href="/(onboarding)/profile" />;
  if (status === 'EMAIL_VERIFICATION_REQUIRED') return <Redirect href="/(auth)/verify-email" />;
  if (status === 'ACCOUNT_SUSPENDED') return <Redirect href="/suspended" />;
  return <Redirect href="/(auth)/welcome" />;
}