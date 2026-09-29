import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { useAuth } from '@/auth/AuthProvider';
import { authService } from '@/services/auth/authService';
import {
  getNotificationPermissionStatus,
  openNotificationSettings,
  requestNotificationPermission,
  isNotificationPermissionGranted,
} from '@/services/notifications/notifications';

export default function Profile() {
  const { profile } = useAuth();
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function refreshPermissions() {
    try {
      const settings = await getNotificationPermissionStatus();
      setNotificationsGranted(isNotificationPermissionGranted(settings));
    } catch {
      setNotificationsGranted(false);
    }
  }

  useEffect(() => { refreshPermissions(); }, []);

  async function enableNotifications() {
    setLoading(true);
    try {
      const settings = await requestNotificationPermission();
      const granted = isNotificationPermissionGranted(settings);
      setNotificationsGranted(granted);
      if (!granted) {
        Alert.alert(
          'Notifications are off',
          'MetlholoAI cannot deliver farm and high-confidence diagnosis alerts until notifications are enabled.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: openNotificationSettings },
          ],
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <AppText variant="largeTitle">Profile</AppText>
      <AppText variant="title3">{profile?.displayName}</AppText>
      <AppText>{profile?.email}</AppText>
      <AppText>Role: {profile?.role}</AppText>
      <AppText>Plan: {profile?.subscriptionTier}</AppText>

      <AppCard>
        <AppText variant="headline">Notifications</AppText>
        <AppText>
          {notificationsGranted
            ? 'Enabled — MetlholoAI can deliver farm and diagnosis alerts.'
            : 'Not enabled — turn this on to receive farm and diagnosis alerts.'}
        </AppText>
        <AppButton
          title={notificationsGranted ? 'Notification settings' : 'Enable notifications'}
          loading={loading}
          onPress={notificationsGranted ? openNotificationSettings : enableNotifications}
        />
      </AppCard>

      <AppButton title="Sign Out" variant="secondary" onPress={() => authService.logout()} />
    </AppScreen>
  );
}
