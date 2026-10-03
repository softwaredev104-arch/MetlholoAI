import { useState } from 'react';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { StatusPill } from '@/components/app/ProductUI';
import { useAuth } from '@/auth/AuthProvider';
import { authService } from '@/services/auth/authService';
import { driveAuthService } from '@/services/drive/driveAuthService';
import { useTheme } from '@/design/themes';

export default function PrivacySecurity() {
  const { firebaseUser, profile } = useAuth();
  const { colors } = useTheme();
  const [driveConnected, setDriveConnected] = useState(
    driveAuthService.isConnected(),
  );
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  async function reconnectDrive() {
    setWorking(true);
    setMessage('');
    try {
      await driveAuthService.connect();
      setDriveConnected(true);
      setMessage('Google Drive access connected for this session.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to connect Google Drive.',
      );
    } finally {
      setWorking(false);
    }
  }

  function disconnectDrive() {
    Alert.alert(
      'Disconnect Google Drive?',
      'New local changes will stop syncing until you reconnect. Existing files in your Drive are not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            driveAuthService.disconnect();
            setDriveConnected(false);
            setMessage('Google Drive disconnected for this session.');
          },
        },
      ],
    );
  }

  async function sendPasswordReset() {
    const email = profile?.email ?? firebaseUser?.email ?? '';
    if (!email) return;
    setWorking(true);
    setMessage('');
    try {
      await authService.resetPassword(email);
      setMessage('Password reset email sent.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send the password reset email.',
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppScreen maxWidth={760}>
      <AppText variant="largeTitle">Privacy & Security</AppText>

      <AppCard>
        <AppText variant="title2">Authentication</AppText>
        <StatusPill
          label={firebaseUser?.emailVerified ? 'Email verified' : 'Verification pending'}
          tone={firebaseUser?.emailVerified ? 'success' : 'warning'}
        />
        <AppText style={{ color: colors.textSecondary }}>
          Sign-in identity is handled by Firebase Authentication.
        </AppText>
        <AppButton
          title="Send Password Reset Email"
          variant="secondary"
          onPress={sendPasswordReset}
          loading={working}
        />
      </AppCard>

      <AppCard>
        <AppText variant="title2">Your farm data</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Farm records are stored on the device and, when you grant permission,
          synchronized to MetlholoAI files in your own Google Drive.
        </AppText>
        <StatusPill
          label={driveConnected ? 'Drive connected' : 'Drive disconnected'}
          tone={driveConnected ? 'success' : 'info'}
        />
        {driveConnected ? (
          <AppButton
            title="Disconnect Google Drive"
            variant="secondary"
            onPress={disconnectDrive}
          />
        ) : (
          <AppButton
            title="Connect Google Drive"
            variant="secondary"
            onPress={reconnectDrive}
            loading={working}
          />
        )}
      </AppCard>

      <AppCard>
        <AppText variant="title2">Data boundaries</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          MetlholoAI does not use Firestore as a farm-record database in this
          architecture. Firebase is used for authentication; user-owned farm
          records remain local and can sync to Google Drive when permission is
          active.
        </AppText>
      </AppCard>

      {message ? <AppText style={{ color: colors.textSecondary }}>{message}</AppText> : null}

      <AppButton title="Back to Profile" variant="ghost" onPress={() => router.back()} />
    </AppScreen>
  );
}
