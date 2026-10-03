import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { updateUserProfile } from '@/services/auth/userProfileService';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

function Preference({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.preference,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primarySubtle : colors.surface,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="footnote" style={{ color: colors.textSecondary }}>
          {description}
        </AppText>
      </View>
      <AppText style={{ color: colors.primary }}>{selected ? 'On' : 'Off'}</AppText>
    </Pressable>
  );
}

export default function NotificationSettings() {
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const [outbreaks, setOutbreaks] = useState(
    profile?.alertPreferences?.outbreaks ?? true,
  );
  const [weather, setWeather] = useState(
    profile?.alertPreferences?.weather ?? true,
  );
  const [market, setMarket] = useState(
    profile?.alertPreferences?.market ?? false,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!firebaseUser) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateUserProfile(firebaseUser.uid, {
        alertPreferences: { outbreaks, weather, market },
      });
      await refreshProfile();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen maxWidth={720}>
      <AppText variant="largeTitle">Notifications</AppText>
      <AppText style={{ color: colors.textSecondary }}>Alerts and updates.</AppText>

      <Preference
        title="Disease outbreak alerts"
        description="Use verified veterinary outbreak information when a trusted feed is connected."
        selected={outbreaks}
        onPress={() => setOutbreaks(value => !value)}
      />
      <Preference
        title="Weather warnings"
        description="Use your mapped farm location for high-impact weather signals."
        selected={weather}
        onPress={() => setWeather(value => !value)}
      />
      <Preference
        title="Market updates"
        description="Use verified Botswana market information when a trusted price feed is connected."
        selected={market}
        onPress={() => setMarket(value => !value)}
      />

      <AppText variant="footnote" style={{ color: colors.textSecondary }}>
        Preferences are saved now. External alerts only activate when a verified data source is connected.
      </AppText>

      {saved ? <AppText style={{ color: colors.success }}>Preferences saved.</AppText> : null}
      <AppButton title="Save Preferences" onPress={save} loading={saving} />
      <AppButton title="Back to Profile" variant="ghost" onPress={() => router.back()} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  preference: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
});
