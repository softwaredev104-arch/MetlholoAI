import { useState } from 'react';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { StatusPill } from '@/components/app/ProductUI';
import { useAuth } from '@/auth/AuthProvider';
import { authService } from '@/services/auth/authService';
import { useTheme } from '@/design/themes';

export default function RestoreData() {
  const { firebaseUser, recoverFromDrive } = useAuth();
  const { colors } = useTheme();
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState('');

  async function recover() {
    setRecovering(true);
    setError('');

    try {
      const recovered = await recoverFromDrive();
      if (!recovered) {
        setError(
          'We recognized your account, but could not restore the MetlholoAI workspace from Google Drive. Make sure you choose the Google account that previously stored your MetlholoAI data.',
        );
        return;
      }
      router.replace('/');
    } finally {
      setRecovering(false);
    }
  }

  async function signOut() {
    await authService.logout();
    router.replace('/(auth)/welcome');
  }

  return (
    <AppScreen maxWidth={720}>
      <AppText variant="largeTitle">Restore your MetlholoAI workspace</AppText>
      <AppText style={{ color: colors.textSecondary }}>
        This Firebase account has been used before, but its local farm workspace
        is not available on this device or browser session.
      </AppText>

      <AppCard>
        <StatusPill label="Returning account" tone="info" />
        <AppText variant="title2">
          {firebaseUser?.email ?? 'Signed-in MetlholoAI account'}
        </AppText>
        <AppText style={{ color: colors.textSecondary }}>
          MetlholoAI will reconnect to the Google Drive permission you previously
          granted and restore your saved profile, farms and farm records. We do
          not create a new farmer profile until recovery has been checked.
        </AppText>
      </AppCard>

      <AppButton
        title="Reconnect Google Drive & Restore"
        icon="cloud-download-outline"
        onPress={recover}
        loading={recovering}
      />

      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}

      <AppButton
        title="Sign Out"
        variant="ghost"
        icon="log-out-outline"
        onPress={signOut}
      />
    </AppScreen>
  );
}
