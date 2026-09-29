import { useState } from 'react';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { authService } from '@/services/auth/authService';
import { getFriendlyErrorMessage } from '@/utils/errorMessage';

export default function Suspended() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setError('');
    setLoading(true);
    try {
      await authService.logout();
      router.replace('/(auth)/welcome');
    } catch (value) {
      setError(getFriendlyErrorMessage(value));
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <AppText variant="largeTitle">Account unavailable</AppText>
      <AppText>Your MetlholoAI account is currently unavailable. Please contact support if you believe this is an error.</AppText>
      {error ? <AppText variant="footnote">{error}</AppText> : null}
      <AppButton title="Sign Out" variant="secondary" loading={loading} onPress={signOut} />
    </AppScreen>
  );
}
