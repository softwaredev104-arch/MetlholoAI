import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { authService } from '@/services/auth/authService';

export default function Profile() {
  const { profile } = useAuth();
  return (
    <AppScreen>
      <AppText variant="largeTitle">Profile</AppText>
      <AppText variant="title3">{profile?.displayName}</AppText>
      <AppText>{profile?.email}</AppText>
      <AppText>Role: {profile?.role}</AppText>
      <AppText>Plan: {profile?.subscriptionTier}</AppText>
      <AppButton title="Sign Out" variant="secondary" onPress={() => authService.logout()} />
    </AppScreen>
  );
}