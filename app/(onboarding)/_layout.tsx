import { Stack } from 'expo-router';
import { ProtectedRoute } from '@/navigation/RouteGuards';

export default function OnboardingLayout() {
  return (
    <ProtectedRoute>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}