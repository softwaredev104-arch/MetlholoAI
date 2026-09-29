import { useState } from 'react';
import { Link, router } from 'expo-router';
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

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export default function SignIn() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError('Enter a valid email and a password with at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.signIn(parsed.data.email, parsed.data.password);
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
        <AppText variant="largeTitle">Welcome back</AppText>
        <AppText style={{ color: colors.textSecondary }}>Sign in to continue to your agricultural workspace.</AppText>
      </View>
      <View style={styles.form}>
        <AppTextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <AppTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
        {error ? <AppText variant="footnote" accessibilityLiveRegion="polite" style={{ color: colors.error }}>{error}</AppText> : null}
        <AppButton title="Sign In" onPress={submit} loading={loading} />
        <Link href="/(auth)/forgot-password" style={{ textAlign: 'center', color: colors.primary }}>Forgot password?</Link>
        <Link href="/(auth)/sign-up" style={{ textAlign: 'center', color: colors.primary }}>Create an account</Link>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.sm, marginTop: Spacing.xl },
  form: { gap: Spacing.lg, marginTop: Spacing.xl },
});