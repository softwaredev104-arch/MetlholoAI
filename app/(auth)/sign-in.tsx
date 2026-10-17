import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { CredentialForm } from '@/components/auth/CredentialForm';
import type { CredentialFields } from '@/components/auth/CredentialForm.types';
import { AppButton } from '@/components/ui/AppButton';
import { authService } from '@/services/auth/authService';
import { getFriendlyErrorMessage } from '@/utils/errorMessage';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export default function SignIn() {
  const { colors } = useTheme();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleSetupError, setGoogleSetupError] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let active = true;
    authService.prepareGoogleSignIn()
      .then(() => { if (active) setGoogleReady(true); })
      .catch(error => {
        if (active) setGoogleSetupError(
          error instanceof Error ? error.message : 'Google sign-in could not load.',
        );
      });
    return () => { active = false; };
  }, []);

  async function submit({ email, password }: CredentialFields) {
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
          <AppText variant="largeTitle">Welcome back</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Sign in to continue to your agricultural workspace.
          </AppText>
        </View>

        <View style={styles.form}>
          <AppButton
            title="Continue with Google"
            variant="secondary"
            onPress={continueWithGoogle}
            loading={googleLoading}
            disabled={loading || !googleReady}
          />
          {googleSetupError ? (
            <AppText variant="footnote" style={{ color: colors.warning }}>
              Google sign-in could not load. Use email sign-in or reload this page.
            </AppText>
          ) : null}

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <AppText variant="footnote" style={{ color: colors.textTertiary }}>or</AppText>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <CredentialForm
            mode="sign-in"
            submitting={loading}
            disabled={googleLoading}
            onSubmit={submit}
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

          <Link href="/(auth)/forgot-password" style={{ textAlign: 'center', color: colors.primary }}>
            Forgot password?
          </Link>
          <Link href="/(auth)/sign-up" style={{ textAlign: 'center', color: colors.primary }}>
            Create an account
          </Link>
          {Platform.OS === 'web' ? (
            <AppText variant="footnote" style={{ color: colors.textTertiary, textAlign: 'center' }}>
              Safari and your password manager can offer to save or fill your email and password.
              MetlholoAI never stores your password itself.
            </AppText>
          ) : null}
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
