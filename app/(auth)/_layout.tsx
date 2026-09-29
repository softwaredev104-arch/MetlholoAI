import { Stack } from 'expo-router';
import { PublicRoute } from '@/navigation/RouteGuards';

export default function AuthLayout() {
  return (
    <PublicRoute>
      <Stack screenOptions={{ headerShown: false }} />
    </PublicRoute>
  );
}