import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { authService } from '@/services/auth/authService';
import { getFriendlyErrorMessage } from '@/utils/errorMessage';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

const schema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export default function SignUp() {
  const { colors } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    const parsed = schema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      setError('Enter your name, a valid email, and a password with at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.signUp(parsed.data.email, parsed.data.password, parsed.data.displayName, 'FARMER');
      router.replace('/');
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="largeTitle">Create your account</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Start with a lightweight profile. We’ll collect more agricultural details as you use MetlholoAI.
        </AppText>
      </View>
      <View style={styles.form}>
        <AppTextField label="Name" value={displayName} onChangeText={setDisplayName} autoComplete="name" />
        <AppTextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <AppTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        {error ? <AppText variant="footnote" accessibilityLiveRegion="polite" style={{ color: colors.error }}>{error}</AppText> : null}
        <AppButton title="Create Account" onPress={submit} loading={loading} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.sm, marginTop: Spacing.xl },
  form: { gap: Spacing.lg, marginTop: Spacing.xl },
});