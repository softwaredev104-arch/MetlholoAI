import { useState } from 'react';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { useAuth } from '@/auth/AuthProvider';
import { updateUserProfile } from '@/services/auth/userProfileService';
import { useTheme } from '@/design/themes';

export default function PersonalInformation() {
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [phone, setPhone] = useState(profile?.phoneNumber ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function save() {
    if (!firebaseUser) return;
    if (name.trim().length < 2) {
      setMessage('Enter your full name.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await updateUserProfile(firebaseUser.uid, {
        displayName: name.trim(),
        phoneNumber: phone.trim() || undefined,
      });
      await refreshProfile();
      setMessage('Personal information saved.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to save your profile.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen maxWidth={720}>
      <AppText variant="largeTitle">Personal Information</AppText>
      <AppText style={{ color: colors.textSecondary }}>
        Name, email, and phone number.
      </AppText>

      <AppTextField
        label="Full name"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
      />
      <AppTextField
        label="Email"
        value={profile?.email ?? firebaseUser?.email ?? ''}
        editable={false}
      />
      <AppTextField
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        placeholder="+267 ..."
        keyboardType="phone-pad"
      />

      <AppCard>
        <AppText variant="headline">Email identity</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Your sign-in email is managed by Firebase Authentication. This screen
          keeps profile contact details in your MetlholoAI user record.
        </AppText>
      </AppCard>

      {message ? (
        <AppText
          style={{
            color: message.includes('saved') ? colors.success : colors.error,
          }}
        >
          {message}
        </AppText>
      ) : null}

      <AppButton title="Save Changes" icon="checkmark" onPress={save} loading={saving} />
      <AppButton
        title="Back to Profile"
        variant="ghost"
        onPress={() => router.back()}
      />
    </AppScreen>
  );
}
