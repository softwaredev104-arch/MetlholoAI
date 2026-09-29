import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { useAuth } from '@/auth/AuthProvider';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

export default function Home() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  return (
    <AppScreen>
      <View style={styles.header}>
        <AppText variant="largeTitle">Good to see you, {profile?.displayName?.split(' ')[0] ?? 'farmer'}.</AppText>
        <AppText style={{ color: colors.textSecondary }}>Here’s the foundation of your MetlholoAI workspace.</AppText>
      </View>
      <AppCard>
        <AppText variant="headline">Farm intelligence</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Weather, crop health, livestock, alerts and AI recommendations will appear here as feature modules are implemented.
        </AppText>
      </AppCard>
      <AppCard>
        <AppText variant="headline">Account</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Role: {profile?.role ?? 'FARMER'} · Plan: {profile?.subscriptionTier ?? 'FREE'}
        </AppText>
      </AppCard>
    </AppScreen>
  );
}
const styles = StyleSheet.create({ header: { gap: Spacing.sm } });