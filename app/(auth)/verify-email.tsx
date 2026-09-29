import { useState } from 'react';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { authService } from '@/services/auth/authService';
import { getFriendlyErrorMessage } from '@/utils/errorMessage';

export default function VerifyEmail() {
  const { firebaseUser, refreshEmailVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  async function checkVerification() {
    setMessage('');
    setLoading(true);
    try {
      const verified = await refreshEmailVerification();
      if (!verified) {
        setMessage('Your email is not verified yet. Open the verification email, verify it, then tap “I’ve verified my email”.');
      }
    } catch (error) {
      setMessage(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setMessage('');
    setResending(true);
    try {
      await authService.resendVerification();
      setMessage('Verification email sent. Check your inbox and spam folder.');
    } catch (error) {
      setMessage(getFriendlyErrorMessage(error));
    } finally {
      setResending(false);
    }
  }

  async function signOut() {
    setMessage('');
    setLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      setMessage(getFriendlyErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <AppText variant="largeTitle">Verify your email</AppText>
      <AppText>
        We sent a verification link to {firebaseUser?.email ?? 'your email address'}. Verify it before opening your agricultural workspace.
      </AppText>
      {message ? <AppText variant="footnote">{message}</AppText> : null}
      <AppButton
        title="I’ve verified my email"
        onPress={checkVerification}
        loading={loading}
        disabled={resending}
      />
      <AppButton
        title="Resend verification"
        variant="secondary"
        onPress={resendVerification}
        loading={resending}
        disabled={loading}
      />
      <AppButton
        title="Sign out"
        variant="secondary"
        onPress={signOut}
        loading={loading}
        disabled={resending}
      />
    </AppScreen>
  );
}
