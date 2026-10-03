import { Link } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function Welcome() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 720;

  return (
    <AppScreen scroll={false} maxWidth={1180}>
      <View style={[styles.shell, !compact && styles.shellWide]}>
        <View style={styles.hero}>
          <View style={[styles.mark, { backgroundColor: colors.primarySubtle }]}>
            <AppText variant="title1" style={{ color: colors.primary }}>M</AppText>
          </View>
          <AppText variant="largeTitle">Detect. Protect. Grow.</AppText>
          <AppText variant="body" style={{ color: colors.textSecondary }}>
            Agricultural intelligence for Botswana — diagnose crops and livestock, manage farm records, track health and act on weather and farm signals.
          </AppText>
        </View>

        <View style={[styles.actionsPanel, { backgroundColor: colors.surface }]}>
          <AppText variant="title2">Get started</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Sign in with your existing account or create a new MetlholoAI workspace.
          </AppText>
          <View style={styles.actions}>
            <Link href="/(auth)/sign-in" asChild>
              <AppButton title="Sign In" onPress={() => {}} />
            </Link>
            <Link href="/(auth)/sign-up" asChild>
              <AppButton title="Create Account" variant="secondary" onPress={() => {}} />
            </Link>
          </View>
        </View>
      </View>

      <AppText variant="caption" style={{ color: colors.textTertiary, textAlign: 'center' }}>
        Designed & developed by Bokang Jobe · MetlholoAI
      </AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xl,
    width: '100%',
  },
  shellWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl * 2,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    minWidth: 0,
  },
  actionsPanel: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  actions: { gap: Spacing.md },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
