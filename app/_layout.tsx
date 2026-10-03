import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { AppProviders } from '@/providers/AppProviders';
import { useTheme } from '@/design/themes';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';

function RootLayoutContent() {
  const { colors } = useTheme();
  const scheme = useColorScheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
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
