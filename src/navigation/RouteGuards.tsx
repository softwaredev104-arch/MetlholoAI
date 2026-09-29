import { PropsWithChildren, useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { AppLoadingState } from '@/components/ui/AppLoadingState';
import { useAuth } from '@/auth/AuthProvider';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();
  useEffect(() => {
    if (status === 'UNAUTHENTICATED') router.replace('/(auth)/welcome');
    if (status === 'PROFILE_INCOMPLETE') router.replace('/(onboarding)/profile');
    if (status === 'ACCOUNT_SUSPENDED') router.replace('/suspended');
  }, [status]);

  if (status !== 'AUTHENTICATED') return <AppLoadingState />;
  return children;
}

export function PublicRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];

  useEffect(() => {
    if (status === 'AUTHENTICATED' && currentRoute !== '(tabs)') {
      router.replace('/(app)/(tabs)');
      return;
    }

    if (status === 'EMAIL_VERIFICATION_REQUIRED' && currentRoute !== 'verify-email') {
      router.replace('/(auth)/verify-email');
      return;
    }

    if (status === 'PROFILE_INCOMPLETE' && segments[0] !== '(onboarding)') {
      router.replace('/(onboarding)/profile');
    }
  }, [status, currentRoute, segments]);

  if (status === 'AUTHENTICATING') return <AppLoadingState />;
  return children;
}
