import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { updateUserProfile } from '@/services/auth/userProfileService';
import type { PrimaryActivity, Role } from '@/types/user';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

const roles: Array<[Role, string]> = [
  ['FARMER', 'Farmer'],
  ['FARM_MANAGER', 'Farm manager'],
  ['AGRONOMIST', 'Agronomist'],
  ['VETERINARIAN', 'Veterinarian'],
  ['AGRICULTURAL_PROFESSIONAL', 'Agricultural professional'],
  ['BUSINESS', 'Agricultural business'],
];

const activities: Array<[PrimaryActivity, string]> = [
  ['CROPS', 'Crops'],
  ['LIVESTOCK', 'Livestock'],
  ['MIXED', 'Mixed farming'],
  ['AGRIBUSINESS', 'Agribusiness'],
  ['PROFESSIONAL', 'Professional services'],
];

export default function ProfileOnboarding() {
  const { colors } = useTheme();
  const { firebaseUser, profile } = useAuth();
  const [name, setName] = useState(
    profile?.displayName ?? firebaseUser?.displayName ?? '',
  );
  const [role, setRole] = useState<Role>(profile?.role ?? 'FARMER');
  const [activity, setActivity] = useState<PrimaryActivity>(
    profile?.primaryActivity ?? 'MIXED',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function next() {
    if (!firebaseUser || name.trim().length < 2) {
      setError('Enter your name so we can personalize MetlholoAI.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateUserProfile(firebaseUser.uid, {
        displayName: name.trim(),
        role,
        primaryActivity: activity,
      });
      router.replace('/(onboarding)/farm-setup');
    } catch {
      setError('We could not save your onboarding details. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={760}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <AppText variant="largeTitle">Tell us about you</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Step 1 of 2 · We use this to personalize models, farm tools and recommendations.
          </AppText>
        </View>

        <AppTextField
          label="Your name"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
        />

        <View style={styles.section}>
          <AppText variant="headline">Your role</AppText>
          <View style={styles.options}>
            {roles.map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: role === value }}
                onPress={() => setRole(value)}
                style={[
                  styles.option,
                  {
                    borderColor: role === value ? colors.primary : colors.border,
                    backgroundColor:
                      role === value ? colors.primarySubtle : colors.surface,
                  },
                ]}
              >
                <AppText>{label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="headline">What best describes your work?</AppText>
          <View style={styles.options}>
            {activities.map(([value, label]) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: activity === value }}
                onPress={() => setActivity(value)}
                style={[
                  styles.option,
                  {
                    borderColor:
                      activity === value ? colors.primary : colors.border,
                    backgroundColor:
                      activity === value ? colors.primarySubtle : colors.surface,
                  },
                ]}
              >
                <AppText>{label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}
        <AppButton title="Continue to farm setup" onPress={next} loading={loading} />
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
    minWidth: 145,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
});
