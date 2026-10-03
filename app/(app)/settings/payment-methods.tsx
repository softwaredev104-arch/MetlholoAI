import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { StatusPill } from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';

export default function PaymentMethods() {
  const { colors } = useTheme();

  return (
    <AppScreen maxWidth={720}>
      <AppText variant="largeTitle">Payment Methods</AppText>

      <AppCard>
        <StatusPill label="Not connected" tone="info" />
        <AppText variant="title2">No payment provider is configured</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          MetlholoAI does not currently collect or store card details. This
          screen remains in the product structure and can be activated when a
          payment provider and subscription contract are implemented.
        </AppText>
      </AppCard>

      <AppButton
        title="Back to Profile"
        variant="ghost"
        onPress={() => router.back()}
      />
    </AppScreen>
  );
}
