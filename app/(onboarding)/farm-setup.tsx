import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { updateUserProfile } from '@/services/auth/userProfileService';

export default function FarmSetup() {
  const { user, refreshProfile } = useAuth();

  async function complete() {
    if (!user) return;
    await updateUserProfile(user.id, { onboardingCompleted: true });
    await refreshProfile();
    router.replace('/');
  }

  return (
    <AppScreen>
      <AppText variant="largeTitle">Ready for your workspace?</AppText>
      <AppText>
        Your Google account is connected. We’ll finish onboarding now and let you add your farm from the workspace.
      </AppText>
      <AppButton title="Open MetlholoAI" onPress={complete} />
    </AppScreen>
  );
}
