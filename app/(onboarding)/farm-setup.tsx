import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { updateUserProfile } from '@/services/auth/userProfileService';

export default function FarmSetup() {
  const { firebaseUser, refreshProfile } = useAuth();

  async function complete() {
    if (!firebaseUser) return;
    await updateUserProfile(firebaseUser.uid, { onboardingCompleted: true });
    await refreshProfile();
    router.replace('/');
  }

  return (
    <AppScreen>
      <AppText variant="largeTitle">Ready for your workspace?</AppText>
      <AppText>
        Farm creation is the next feature phase. For this foundation flow, we’ll finish account onboarding now and open the MetlholoAI workspace.
      </AppText>
      <AppButton title="Open MetlholoAI" onPress={complete} />
    </AppScreen>
  );
}