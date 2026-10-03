import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { authService } from '@/services/auth/authService';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

export default function SignIn() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function continueWithGoogle() {
    setLoading(true);
    setError('');
    try {
      await authService.signInWithGoogle();
    } catch {
      setError('Google sign-in is not configured yet. Add the OAuth keys to Cloudflare and try again.');
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="largeTitle">Welcome back</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Continue securely with your Google account.
        </AppText>
      </View>
      <View style={styles.form}>
        {error ? <AppText variant="footnote" style={{ color: colors.error }}>{error}</AppText> : null}
        <AppButton title="Continue with Google" onPress={continueWithGoogle} loading={loading} />
        <AppText variant="caption" style={{ color: colors.textTertiary, textAlign: 'center' }}>
          MetlholoAI does not use a Firebase password account.
        </AppText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.sm, marginTop: Spacing.xl },
  form: { gap: Spacing.lg, marginTop: Spacing.xl },
});
