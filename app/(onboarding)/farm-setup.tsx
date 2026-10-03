import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { useAuth } from '@/auth/AuthProvider';
import { driveAuthService } from '@/services/drive/driveAuthService';
import {
  syncUserProfileToDrive,
  updateUserProfile,
} from '@/services/auth/userProfileService';
import { createFarm, listFarms } from '@/services/farms/farmRepository';
import type { FarmSizeBand, FarmType } from '@/types/user';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

const farmTypes: Array<[FarmType, string]> = [
  ['CROPS', 'Crop farm'],
  ['LIVESTOCK', 'Livestock farm'],
  ['MIXED', 'Mixed farm'],
];

const farmSizes: Array<[FarmSizeBand, string]> = [
  ['SMALL', 'Small · 1–5 ha'],
  ['MEDIUM', 'Medium · 5–20 ha'],
  ['LARGE', 'Large · 20+ ha'],
];

export default function FarmSetup() {
  const { colors } = useTheme();
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const [farmName, setFarmName] = useState(profile?.farmName ?? '');
  const [farmType, setFarmType] = useState<FarmType>(
    profile?.farmType ?? 'MIXED',
  );
  const [farmSizeBand, setFarmSizeBand] = useState<FarmSizeBand>(
    profile?.farmSizeBand ?? 'SMALL',
  );
  const [location, setLocation] = useState(profile?.locationLabel ?? '');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [outbreaks, setOutbreaks] = useState(
    profile?.alertPreferences?.outbreaks ?? true,
  );
  const [weatherAlerts, setWeatherAlerts] = useState(
    profile?.alertPreferences?.weather ?? true,
  );
  const [marketAlerts, setMarketAlerts] = useState(
    profile?.alertPreferences?.market ?? false,
  );
  const [driveConnected, setDriveConnected] = useState(
    driveAuthService.isConnected(),
  );
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');

  async function connectDrive() {
    setConnectingDrive(true);
    setError('');
    try {
      await driveAuthService.connect();
      setDriveConnected(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Google Drive could not be connected.',
      );
    } finally {
      setConnectingDrive(false);
    }
  }

  async function complete() {
    if (!firebaseUser) return;

    if (farmName.trim().length < 2) {
      setError('Enter a farm or operation name.');
      return;
    }

    if (location.trim().length < 2) {
      setError('Choose your town, village or farm location.');
      return;
    }

    if (!driveConnected) {
      setError('Connect Google Drive before finishing onboarding.');
      return;
    }

    setFinishing(true);
    setError('');

    try {
      const existingFarms = await listFarms(firebaseUser.uid);
      if (existingFarms.length === 0) {
        await createFarm(firebaseUser.uid, {
          name: farmName.trim(),
          location: location.trim(),
          farmType,
          farmSizeBand,
          latitude,
          longitude,
        });
      }

      await updateUserProfile(firebaseUser.uid, {
        farmName: farmName.trim(),
        farmType,
        farmSizeBand,
        locationLabel: location.trim(),
        alertPreferences: {
          outbreaks,
          weather: weatherAlerts,
          market: marketAlerts,
        },
        onboardingCompleted: true,
      });

      await syncUserProfileToDrive(firebaseUser.uid);
      await refreshProfile();
      router.replace('/(app)/(tabs)');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'We could not finish onboarding.',
      );
    } finally {
      setFinishing(false);
    }
  }

  const Toggle = ({
    label,
    description,
    selected,
    onPress,
  }: {
    label: string;
    description: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.preference,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primarySubtle : colors.surface,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="headline">{label}</AppText>
        <AppText variant="footnote" style={{ color: colors.textSecondary }}>
          {description}
        </AppText>
      </View>
      <AppText style={{ color: colors.primary }}>{selected ? 'On' : 'Off'}</AppText>
    </Pressable>
  );

  return (
    <AppScreen maxWidth={780}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <AppText variant="largeTitle">Tell us about your farm</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Step 2 of 2 · This personalizes disease alerts, weather and farm tools.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="headline">Farm identity</AppText>
          <LocationPicker
            value={location}
            onSelect={next => {
              setLocation(next.label);
              setLatitude(next.latitude);
              setLongitude(next.longitude);
            }}
          />
        </View>

        <View style={styles.section}>
          <AppText variant="headline">What do you produce?</AppText>
          <View style={styles.options}>
            {farmTypes.map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setFarmType(value)}
                style={[
                  styles.option,
                  {
                    borderColor: farmType === value ? colors.primary : colors.border,
                    backgroundColor:
                      farmType === value ? colors.primarySubtle : colors.surface,
                  },
                ]}
              >
                <AppText>{label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="headline">Farm size</AppText>
          <View style={styles.options}>
            {farmSizes.map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setFarmSizeBand(value)}
                style={[
                  styles.option,
                  {
                    borderColor:
                      farmSizeBand === value ? colors.primary : colors.border,
                    backgroundColor:
                      farmSizeBand === value ? colors.primarySubtle : colors.surface,
                  },
                ]}
              >
                <AppText>{label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <AppTextField
          label="Farm or operation name"
          value={farmName}
          onChangeText={setFarmName}
          placeholder="e.g. Ditlhong Farm"
        />

        <View style={styles.section}>
          <AppText variant="headline">Notifications</AppText>
          <Toggle
            label="Local disease alerts"
            description="Outbreaks and health risks around your region."
            selected={outbreaks}
            onPress={() => setOutbreaks(value => !value)}
          />
          <Toggle
            label="Weather warnings"
            description="Heavy rain, drought, frost and other farm weather signals."
            selected={weatherAlerts}
            onPress={() => setWeatherAlerts(value => !value)}
          />
          <Toggle
            label="Market insights"
            description="Price and market updates for crops and livestock."
            selected={marketAlerts}
            onPress={() => setMarketAlerts(value => !value)}
          />
        </View>

        <View style={[styles.driveCard, { backgroundColor: colors.surface }]}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="headline">Google Drive storage</AppText>
            <AppText style={{ color: colors.textSecondary }}>
              MetlholoAI stores the profile and farm files it creates in your own Google Drive.
            </AppText>
          </View>

          {driveConnected ? (
            <AppText style={{ color: colors.success }}>Connected ✓</AppText>
          ) : (
            <AppButton
              title="Connect Google Drive"
              variant="secondary"
              onPress={connectDrive}
              loading={connectingDrive}
            />
          )}
        </View>

        {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}

        <AppButton
          title="Continue to Dashboard"
          onPress={complete}
          loading={finishing}
          disabled={connectingDrive}
          icon="arrow-forward"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  header: { gap: Spacing.sm },
  section: { gap: Spacing.md },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  option: {
    minWidth: 150,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  preference: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  driveCard: {
    borderRadius: 18,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
});
