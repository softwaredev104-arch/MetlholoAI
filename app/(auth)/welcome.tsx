import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function Welcome() {
  const { colors } = useTheme();
  return (
    <AppScreen scroll={false}>
      <View style={styles.hero}>
        <View style={[styles.mark, { backgroundColor: colors.primarySubtle }]}>
          <AppText variant="title1" style={{ color: colors.primary }}>M</AppText>
        </View>
        <AppText variant="largeTitle">Agricultural intelligence, built for Botswana.</AppText>
        <AppText variant="body" style={{ color: colors.textSecondary }}>
          MetlholoAI helps farmers and agricultural professionals understand what needs attention and decide what to do next.
        </AppText>
      </View>
      <View style={styles.actions}>
        <Link href="/(auth)/sign-in" asChild>
          <AppButton title="Sign In" onPress={() => {}} />
        </Link>
        <Link href="/(auth)/sign-up" asChild>
          <AppButton title="Create Account" variant="secondary" onPress={() => {}} />
        </Link>
      </View>
      <AppText variant="caption" style={{ color: colors.textTertiary, textAlign: 'center' }}>
        Built by Bokang Jobe · MetlholoAI
      </AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: Spacing.lg },
  actions: { gap: Spacing.md },
  mark: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});