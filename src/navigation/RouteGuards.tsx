import { PropsWithChildren, useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { AppLoadingState } from '@/components/ui/AppLoadingState';
import { useAuth } from '@/auth/AuthProvider';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const segments = useSegments();
  const segmentKey = segments.join('/');
  const rootSegment = segments[0] ?? '';

  useEffect(() => {
    if (status === 'UNAUTHENTICATED' && rootSegment !== '(auth)') {
      router.replace('/(auth)/welcome');
      return;
    }

    if (status === 'PROFILE_INCOMPLETE' && rootSegment !== '(onboarding)') {
      router.replace('/(onboarding)/profile');
      return;
    }

    if (status === 'ACCOUNT_SUSPENDED' && rootSegment !== 'suspended') {
      router.replace('/suspended');
    }
  }, [status, rootSegment, segmentKey]);

  if (status !== 'AUTHENTICATED' && status !== 'PROFILE_INCOMPLETE') {
    return <AppLoadingState />;
  }

  return children;
}

export function PublicRoute({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const segments = useSegments();
  const segmentKey = segments.join('/');
  const rootSegment = segments[0] ?? '';
  const currentRoute = segments[segments.length - 1] ?? '';

  useEffect(() => {
    if (status === 'AUTHENTICATED' && rootSegment !== '(app)') {
      router.replace('/(app)/(tabs)');
      return;
    }

    if (status === 'EMAIL_VERIFICATION_REQUIRED' && currentRoute !== 'verify-email') {
      router.replace('/(auth)/verify-email');
      return;
    }

    if (status === 'PROFILE_INCOMPLETE' && rootSegment !== '(onboarding)') {
      router.replace('/(onboarding)/profile');
    }
  }, [status, rootSegment, currentRoute, segmentKey]);

  if (status === 'AUTHENTICATING') return <AppLoadingState />;
  return children;
}
