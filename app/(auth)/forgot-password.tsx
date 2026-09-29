import { useState } from 'react';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { authService } from '@/services/auth/authService';
import { getFriendlyErrorMessage } from '@/utils/errorMessage';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setMessage('If an account exists for this email, password reset instructions have been sent.');
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <AppText variant="largeTitle">Reset password</AppText>
      <AppText>Enter your email and we’ll send password recovery instructions.</AppText>
      <AppTextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      {message ? <AppText accessibilityLiveRegion="polite">{message}</AppText> : null}
      {error ? <AppText accessibilityLiveRegion="polite" style={{ color: '#B33A3A' }}>{error}</AppText> : null}
      <AppButton title="Send Reset Email" onPress={submit} loading={loading} />
    </AppScreen>
  );
}