import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { authService } from '@/services/auth/authService';
import { driveAuthService } from '@/services/drive/driveAuthService';
import { StatusPill } from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

type SettingsItem = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  target: string;
};

export default function Profile() {
  const { profile } = useAuth();
  const { farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [driveConnected, setDriveConnected] = useState(
    driveAuthService.isConnected(),
  );
  const [connecting, setConnecting] = useState(false);

  async function connectDrive() {
    setConnecting(true);
    try {
      await driveAuthService.connect();
      setDriveConnected(true);
    } finally {
      setConnecting(false);
    }
  }

  const accountSettings: SettingsItem[] = [
    {
      icon: 'person-outline',
      title: 'Personal Information',
      subtitle: 'Name, email, and phone number',
      target: '/(app)/settings/personal-information',
    },
    {
      icon: 'leaf-outline',
      title: 'My Farms',
      subtitle: farm ? farm.name : 'Manage registered farm locations',
      target: '/(app)/settings/farms',
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'No payment provider connected',
      target: '/(app)/settings/payment-methods',
    },
  ];

  const preferences: SettingsItem[] = [
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Alerts and updates',
      target: '/(app)/settings/notifications',
    },
    {
      icon: 'language-outline',
      title: 'Language',
      subtitle: 'English (SADC)',
      target: '/(app)/settings/language',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy & Security',
      subtitle: 'Authentication and your data',
      target: '/(app)/settings/privacy-security',
    },
  ];

  const SettingsCard = ({ item }: { item: SettingsItem }) => (
    <AppCard onPress={() => router.push(item.target as any)}>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name={item.icon} size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="headline">{item.title}</AppText>
          {item.subtitle ? (
            <AppText variant="footnote" style={{ color: colors.textSecondary }}>
              {item.subtitle}
            </AppText>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>
    </AppCard>
  );

  return (
    <AppScreen maxWidth={900}>
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}>
          <AppText variant="title1" style={{ color: colors.primary }}>
            {(profile?.displayName || 'M')
              .split(' ')
              .map(item => item[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="largeTitle">{profile?.displayName || 'MetlholoAI user'}</AppText>
          <AppText style={{ color: colors.textSecondary }}>{profile?.email}</AppText>
        </View>
        <StatusPill
          label={(profile?.subscriptionTier || 'FREE') + ' PLAN'}
          tone="success"
        />
      </View>

      <AppCard>
        <AppText variant="title2">Account</AppText>
        <View style={styles.pills}>
          <StatusPill label={profile?.role || 'FARMER'} />
          {profile?.primaryActivity ? (
            <StatusPill label={profile.primaryActivity} tone="info" />
          ) : null}
          {farm?.farmType ? (
            <StatusPill label={farm.farmType} tone="success" />
          ) : null}
        </View>
      </AppCard>

      <AppCard>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primarySubtle }]}>
            <Ionicons name="cloud-outline" size={23} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="headline">Google Drive data</AppText>
            <AppText style={{ color: colors.textSecondary }}>
              {driveConnected
                ? 'Drive permission is active for this session.'
                : 'Reconnect Drive when you want new changes synced to your MetlholoAI folder.'}
            </AppText>
          </View>
        </View>
        {!driveConnected ? (
          <AppButton
            title="Reconnect Google Drive"
            variant="secondary"
            onPress={connectDrive}
            loading={connecting}
          />
        ) : null}
      </AppCard>

      <AppText variant="title2">Account Settings</AppText>
      {accountSettings.map(item => (
        <SettingsCard key={item.title} item={item} />
      ))}

      <AppText variant="title2">App Preferences</AppText>
      {preferences.map(item => (
        <SettingsCard key={item.title} item={item} />
      ))}

      {profile?.role === 'ADMIN' ? (
        <AppButton
          title="Open Admin Console"
          variant="secondary"
          icon="settings-outline"
          onPress={() => router.push('/(app)/admin' as any)}
        />
      ) : null}

      <AppButton
        title="Sign Out"
        variant="destructive"
        icon="log-out-outline"
        onPress={() => authService.logout()}
      />

      <AppText
        variant="caption"
        style={{ color: colors.textTertiary, textAlign: 'center' }}
      >
        Designed & developed by Bokang Jobe · MetlholoAI
      </AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
