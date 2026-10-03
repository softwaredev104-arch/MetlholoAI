import { Stack } from 'expo-router';
import { OnboardingRoute } from '@/navigation/RouteGuards';

export default function OnboardingLayout() {
  return (
    <OnboardingRoute>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingRoute>
  );
}
