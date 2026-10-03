import { useState } from 'react';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { driveAuthService } from '@/services/drive/driveAuthService';
import { syncUserProfileToDrive, updateUserProfile } from '@/services/auth/userProfileService';

export default function DriveSetup() {
  const { firebaseUser, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(driveAuthService.isConnected());
  const [error, setError] = useState('');

  async function connect() {
    setLoading(true);
    setError('');
    try {
      await driveAuthService.connect();
      setConnected(true);
      if (firebaseUser) await syncUserProfileToDrive(firebaseUser.uid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google Drive could not be connected.');
    } finally {
      setLoading(false);
    }
  }

  async function complete() {
    if (!firebaseUser || !connected) return;
    setLoading(true);
    setError('');
    try {
      await updateUserProfile(firebaseUser.uid, { onboardingCompleted: true });
      await refreshProfile();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We could not finish onboarding.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <AppText variant="largeTitle">Connect your Google Drive</AppText>
      <AppText>
        MetlholoAI uses Firebase Authentication for your account. Your farm data and app-created files can be stored in a MetlholoAI folder in your own Google Drive.
      </AppText>
      <AppText>
        MetlholoAI requests permission only for Drive files it creates for you.
      </AppText>
      {error ? <AppText style={{ color: '#B33A3A' }}>{error}</AppText> : null}
      {!connected ? (
        <AppButton title="Connect Google Drive" onPress={connect} loading={loading} />
      ) : (
        <AppButton title="Open MetlholoAI" onPress={complete} loading={loading} />
      )}
    </AppScreen>
  );
}
