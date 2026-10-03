import { PropsWithChildren, useEffect } from 'react';
import { router } from 'expo-router';
import { AppLoadingState } from '@/components/ui/AppLoadingState';
import { useAuth } from '@/auth/AuthProvider';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'UNAUTHENTICATED') router.replace('/(auth)/welcome');
    else if (status === 'EMAIL_VERIFICATION_REQUIRED') router.replace('/(auth)/verify-email');
    else if (status === 'PROFILE_INCOMPLETE') router.replace('/(onboarding)/profile');
    else if (status === 'ACCOUNT_SUSPENDED') router.replace('/suspended');
  }, [status]);

  if (status !== 'AUTHENTICATED') return <AppLoadingState />;
  return children;
}

export function OnboardingRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'UNAUTHENTICATED') router.replace('/(auth)/welcome');
    else if (status === 'EMAIL_VERIFICATION_REQUIRED') router.replace('/(auth)/verify-email');
    else if (status === 'ACCOUNT_SUSPENDED') router.replace('/suspended');
    else if (status === 'AUTHENTICATED') router.replace('/(app)/(tabs)');
  }, [status]);

  if (status === 'AUTHENTICATING') return <AppLoadingState />;
  if (status === 'PROFILE_INCOMPLETE') return children;
  return <AppLoadingState />;
}

export function PublicRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'AUTHENTICATED') router.replace('/(app)/(tabs)');
    else if (status === 'PROFILE_INCOMPLETE') router.replace('/(onboarding)/profile');
    else if (status === 'ACCOUNT_SUSPENDED') router.replace('/suspended');
  }, [status]);

  if (status === 'AUTHENTICATING') return <AppLoadingState />;
  return children;
}
