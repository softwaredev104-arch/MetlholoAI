import { Stack } from 'expo-router';
import { ProtectedRoute } from '@/navigation/RouteGuards';

export default function AppLayout() {
  return (
    <ProtectedRoute>
      <Stack screenOptions={{ headerShown: false }} />
    </ProtectedRoute>
  );
}