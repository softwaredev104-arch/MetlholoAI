import { PropsWithChildren, useEffect } from 'react';
import { router } from 'expo-router';
import { AppLoadingState } from '@/components/ui/AppLoadingState';
import { useAuth } from '@/auth/AuthProvider';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();
  useEffect(() => {
    if (status === 'UNAUTHENTICATED') router.replace('/(auth)/welcome');
    if (status === 'EMAIL_VERIFICATION_REQUIRED') router.replace('/(auth)/verify-email');
    if (status === 'PROFILE_INCOMPLETE') router.replace('/(onboarding)/profile');
    if (status === 'ACCOUNT_SUSPENDED') router.replace('/suspended');
  }, [status]);
  if (status !== 'AUTHENTICATED') return <AppLoadingState />;
  return children;
}

export function PublicRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();
  useEffect(() => {
    if (status === 'UNAUTHENTICATED') router.replace('/(auth)/welcome');
    if (status === 'AUTHENTICATED') router.replace('/(app)/(tabs)');
    if (status === 'EMAIL_VERIFICATION_REQUIRED') router.replace('/(auth)/verify-email');
    if (status === 'PROFILE_INCOMPLETE') router.replace('/(onboarding)/profile');
  }, [status]);
  if (status === 'AUTHENTICATING') return <AppLoadingState />;
  return children;
}
