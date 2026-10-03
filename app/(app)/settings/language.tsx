import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { StatusPill } from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';

export default function LanguageSettings() {
  const { colors } = useTheme();

  return (
    <AppScreen maxWidth={720}>
      <AppText variant="largeTitle">Language</AppText>
      <AppText style={{ color: colors.textSecondary }}>
        App language and regional wording.
      </AppText>

      <AppCard>
        <StatusPill label="Selected" tone="success" />
        <AppText variant="title2">English (SADC)</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          MetlholoAI currently ships one verified interface language. More
          languages can be added after the complete product copy and
          agricultural terminology are translated and reviewed.
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
