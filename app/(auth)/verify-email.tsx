import { sendEmailVerification } from 'firebase/auth';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { authService } from '@/services/auth/authService';

export default function VerifyEmail() {
  const { firebaseUser } = useAuth();
  return (
    <AppScreen>
      <AppText variant="largeTitle">Verify your email</AppText>
      <AppText>
        MetlholoAI requires a verified email before your agricultural workspace can be opened.
      </AppText>
      <AppButton
        title="Resend verification"
        onPress={async () => {
          if (firebaseUser) await sendEmailVerification(firebaseUser);
        }}
      />
      <AppButton title="Sign out" variant="secondary" onPress={() => authService.logout()} />
    </AppScreen>
  );
}