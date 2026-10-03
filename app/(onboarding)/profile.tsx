import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { updateUserProfile } from '@/services/auth/userProfileService';
import { Spacing } from '@/design/spacing';

export default function ProfileOnboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function next() {
    if (!user || name.trim().length < 2) {
      setError('Enter your name so we can personalize MetlholoAI.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateUserProfile(user.id, { displayName: name.trim() });
      await refreshProfile();
      router.replace('/(onboarding)/farm-setup');
    } catch {
      setError('We could not save your profile. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="largeTitle">Let’s set up your profile</AppText>
        <AppText>Your Google account is connected. We’ll keep onboarding short.</AppText>
      </View>
      <AppTextField label="Your name" value={name} onChangeText={setName} autoComplete="name" />
      {error ? <AppText style={{ color: '#B33A3A' }}>{error}</AppText> : null}
      <AppButton title="Continue" onPress={next} loading={loading} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({ header: { gap: Spacing.sm } });
