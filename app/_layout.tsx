import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { useTheme } from '@/design/themes';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';

function RootLayoutContent() {
  const { colors } = useTheme();
  return (
    <>
      <StatusBar style={colors.background === '#0E1411' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <RootLayoutContent />
      </AppProviders>
    </ErrorBoundary>
  );
}