import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { driveAuthService } from '@/services/drive/driveAuthService';
import {
  syncUserProfileToDrive,
  updateUserProfile,
} from '@/services/auth/userProfileService';
import {
  createFarm,
  listFarms,
} from '@/services/farms/farmRepository';
import type { FarmType } from '@/types/user';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

const farmTypes: Array<[FarmType, string]> = [
  ['CROPS', 'Crop farm'],
  ['LIVESTOCK', 'Livestock farm'],
  ['MIXED', 'Mixed farm'],
];

export default function FarmSetup() {
  const { colors } = useTheme();
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const [farmName, setFarmName] = useState(profile?.farmName ?? '');
  const [farmType, setFarmType] = useState<FarmType>(
    profile?.farmType ?? 'MIXED',
  );
  const [location, setLocation] = useState(profile?.locationLabel ?? '');
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
      setError('Enter your town, village or farm location.');
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
        });
      }

      await updateUserProfile(firebaseUser.uid, {
        farmName: farmName.trim(),
        farmType,
        locationLabel: location.trim(),
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

  return (
    <AppScreen maxWidth={760}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <AppText variant="largeTitle">Set up your farm</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Step 2 of 2 · This creates your first farm workspace and personalizes weather and intelligence.
          </AppText>
        </View>

        <AppTextField
          label="Farm or operation name"
          value={farmName}
          onChangeText={setFarmName}
          placeholder="e.g. Jobe Farm"
        />

        <View style={styles.section}>
          <AppText variant="headline">Farm type</AppText>
          <View style={styles.options}>
            {farmTypes.map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: farmType === value }}
                onPress={() => setFarmType(value)}
                style={[
                  styles.option,
                  {
                    borderColor:
                      farmType === value ? colors.primary : colors.border,
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

        <AppTextField
          label="Town, village or farm location"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Gaborone, Tlokweng, Maun"
          autoComplete="street-address"
        />

        <View style={[styles.driveCard, { backgroundColor: colors.surface }]}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="headline">Google Drive storage</AppText>
            <AppText style={{ color: colors.textSecondary }}>
              Your MetlholoAI profile and farm data will be stored in files created in your own Google Drive.
            </AppText>
          </View>

          {driveConnected ? (
            <AppText style={{ color: colors.primary }}>Connected ✓</AppText>
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
          title="Finish setup and open MetlholoAI"
          onPress={complete}
          loading={finishing}
          disabled={connectingDrive}
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
  driveCard: {
    borderRadius: 18,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
});
