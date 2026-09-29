import { useLocalSearchParams, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { INTELLIGENCE_MODELS } from '@/services/intelligence/catalog';
import { Spacing } from '@/design/spacing';

export default function ModelGuide() {
  const { modelId } = useLocalSearchParams<{ modelId: string }>();
  const model = INTELLIGENCE_MODELS.find(item => item.id === modelId) ?? INTELLIGENCE_MODELS[0];

  return (
    <AppScreen>
      <AppText variant="largeTitle">{model.name}</AppText>
      <AppText style={styles.muted}>How to capture the image for {model.subject}.</AppText>

      <AppText variant="headline">Before you capture</AppText>
      <View style={styles.samples}>
        {[1, 2, 3].map(item => (
          <AppCard key={item} style={styles.sample}><AppText>Training sample {item}</AppText><AppText style={styles.muted}>Image placeholder</AppText></AppCard>
        ))}
      </View>

      <View style={styles.compare}>
        <AppCard style={styles.compareCard}><AppText variant="headline">Acceptable</AppText><View style={styles.placeholder} /><AppText style={styles.muted}>Clear subject, sharp detail, good light.</AppText></AppCard>
        <AppCard style={styles.compareCard}><AppText variant="headline">Unacceptable</AppText><View style={styles.placeholder} /><AppText style={styles.muted}>Blurred, dark, obstructed or distant.</AppText></AppCard>
      </View>

      <AppCard>
        <AppText variant="headline">Five ways to improve your diagnosis photo</AppText>
        {model.trainingImageHints.concat(['Keep the camera steady', 'Avoid harsh glare', 'Fill the frame with the relevant feature', 'Use daylight where possible', 'Do not cover the affected area']).slice(0, 5).map((hint, index) => (
          <AppText key={hint}>{index + 1}. {hint}</AppText>
        ))}
      </AppCard>

      <AppButton title="Open camera & diagnose" onPress={() => router.push('/scan')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  muted: { opacity: 0.7 },
  samples: { flexDirection: 'row', gap: Spacing.sm },
  sample: { flex: 1, minHeight: 120, justifyContent: 'center' },
  compare: { flexDirection: 'row', gap: Spacing.md },
  compareCard: { flex: 1 },
  placeholder: { height: 100, borderRadius: 12, marginVertical: Spacing.sm, backgroundColor: '#DDE5DF' },
});
