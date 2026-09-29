import { Linking, Platform } from 'react-native';
import type * as NotificationsTypes from 'expo-notifications';

type NotificationPermissionResult = {
  granted: boolean;
  ios?: {
    status?: number;
  };
};

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) return notificationsModule;

  try {
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch {
    // Expo Go on Android does not include remote notification support.
    // Keep the app usable; a development build provides the real module.
    notificationsModule = null;
  }

  return notificationsModule;
}

function configureNotificationHandler() {
  const Notifications = getNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

export async function configureNotificationChannel() {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'Agricultural alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionResult> {
  const Notifications = getNotifications();
  if (!Notifications) return { granted: false };

  configureNotificationHandler();
  await configureNotificationChannel();
  return Notifications.getPermissionsAsync();
}

export function isNotificationPermissionGranted(settings: NotificationPermissionResult) {
  const Notifications = getNotifications();
  return settings.granted || Boolean(
    Notifications &&
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
  );
}

export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  const Notifications = getNotifications();
  if (!Notifications) return { granted: false };

  configureNotificationHandler();
  await configureNotificationChannel();

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
}

export async function openNotificationSettings() {
  await Linking.openSettings();
}

// Keep the module's public type import available to TypeScript consumers
// without loading expo-notifications during module evaluation.
export type NotificationPermissionsStatus = NotificationsTypes.NotificationPermissionsStatus;
