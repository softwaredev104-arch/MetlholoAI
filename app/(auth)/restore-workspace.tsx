import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { driveAuthService } from '@/services/drive/driveAuthService';
import { restoreWorkspaceFromDrive } from '@/services/drive/workspaceRecovery';
import { authService } from '@/services/auth/authService';
import { useTheme } from '@/design/themes';

export default function RestoreWorkspace() {
  const { firebaseUser, refreshProfile, startNewProfile } = useAuth();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [error, setError] = useState('');

  async function restore(forceConsent = false) {
    if (!firebaseUser) return;
    setLoading(true);
    setError('');
    try {
      await driveAuthService.connect({
        forceConsent,
        preferExistingGrant: true,
      });
      const outcome = await restoreWorkspaceFromDrive(firebaseUser);
      if (!outcome.found) {
        setNotFound(true);
        setError(
          'No previous MetlholoAI files were found in this Google account. ' +
          'If you used the app before, check that this is the same Google Drive.',
        );
        return;
      }
      await refreshProfile();
      router.replace('/');
    } catch (e) {
      setNeedsConsent(true);
      setError(e instanceof Error ? e.message : 'Could not restore the workspace.');
    } finally {
      setLoading(false);
    }
  }

  async function createLocal() {
    setLoading(true);
    setError('');
    try {
      await startNewProfile();
      router.replace('/(onboarding)/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start onboarding.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={720}>
      <AppText variant="largeTitle">Welcome back to MetlholoAI</AppText>
      <AppText style={{ color: colors.textSecondary }}>
        Your Firebase sign-in is recognized. This device has no complete local
        workspace for {firebaseUser?.email ?? 'your account'}.
      </AppText>

      <AppCard>
        <AppText variant="title2">Restore your farm from Google Drive</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          If you previously connected Drive, you do not have to register
          again. Use the same Google account to restore your farms, animals,
          crops, health records and saved diagnoses.
        </AppText>
        <AppButton
          title="Restore my workspace"
          icon="cloud-download-outline"
          onPress={() => restore()}
          loading={loading}
        />
        {needsConsent ? (
          <AppButton
            title="Grant Google Drive access again"
            variant="secondary"
            onPress={() => restore(true)}
            disabled={loading}
          />
        ) : null}
      </AppCard>

      {error ? (
        <AppText style={{ color: colors.error }}>{error}</AppText>
      ) : null}

      <AppCard>
        <AppText variant="headline">First time using MetlholoAI?</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Only create a new local workspace if you have never used the app, or
          have confirmed that no older Drive backup needs restoring. This
          action does not delete or overwrite any files in Google Drive.
        </AppText>
        {!confirmNew ? (
          <AppButton
            title={notFound ? 'Continue with a new workspace' : 'I am a new user'}
            variant="secondary"
            onPress={() => setConfirmNew(true)}
            disabled={loading}
          />
        ) : (
          <View style={{ gap: 12 }}>
            <AppText>
              Confirm that you want to start local onboarding rather than
              restore your previous farm.
            </AppText>
            <AppButton
              title="Confirm new workspace"
              variant="secondary"
              onPress={createLocal}
              loading={loading}
            />
          </View>
        )}
      </AppCard>

      <AppButton
        title="Sign in with a different account"
        variant="ghost"
        onPress={async () => {
          driveAuthService.clearSession();
          await authService.logout();
          router.replace('/(auth)/sign-in');
        }}
      />
    </AppScreen>
  );
}
