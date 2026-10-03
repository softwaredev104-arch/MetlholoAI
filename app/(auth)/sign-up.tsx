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
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function continueWithGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
      router.replace('/');
    } catch (e) {
      setError(getFriendlyErrorMessage(e));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={760}>
      <View style={styles.shell}>
        <View style={styles.header}>
          <AppText variant="largeTitle">Create your account</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Start with a lightweight profile. We’ll collect more agricultural details as you use MetlholoAI.
          </AppText>
        </View>

        <View style={styles.form}>
          <AppButton
            title="Continue with Google"
            variant="secondary"
            onPress={continueWithGoogle}
            loading={googleLoading}
            disabled={loading}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <AppText variant="footnote" style={{ color: colors.textTertiary }}>or</AppText>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <AppTextField
            label="Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            textContentType="name"
          />
          <AppTextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <AppTextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={submit}
          />

          {error ? (
            <AppText
              variant="footnote"
              accessibilityLiveRegion="polite"
              style={{ color: colors.error }}
            >
              {error}
            </AppText>
          ) : null}

          <AppButton
            title="Create Account"
            onPress={submit}
            loading={loading}
            disabled={googleLoading}
          />

          <Link href="/(auth)/sign-in" style={{ textAlign: 'center', color: colors.primary }}>
            Already have an account? Sign in
          </Link>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  header: { gap: Spacing.sm },
  form: { gap: Spacing.lg },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dividerLine: {
    height: StyleSheet.hairlineWidth,
    flex: 1,
  },
});
