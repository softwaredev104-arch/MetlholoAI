import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { authService } from '@/services/auth/authService';

export default function Suspended() {
  return (
    <AppScreen>
      <AppText variant="largeTitle">Account unavailable</AppText>
      <AppText>Your MetlholoAI account is currently unavailable. Please contact support if you believe this is an error.</AppText>
      <AppButton title="Sign Out" variant="secondary" onPress={() => authService.logout()} />
    </AppScreen>
  );
}