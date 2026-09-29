import { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { INTELLIGENCE_MODELS } from '@/services/intelligence/catalog';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

export default function ModelGuide() {
  const { colors } = useTheme();
  const { modelId } = useLocalSearchParams<{ modelId: string }>();
  const model = useMemo(() => INTELLIGENCE_MODELS.find(item => item.id === modelId), [modelId]);

  if (!model) {
    return (
      <AppScreen>
        <AppText variant="largeTitle">Model unavailable</AppText>
        <AppText style={{ color: colors.textSecondary }}>The selected intelligence model could not be found.</AppText>
        <AppButton title="Back to Explore" onPress={() => router.replace('/intelligence')} />
      </AppScreen>
    );
  }

  const hints = [
    ...model.trainingImageHints,
    'Keep the camera steady and focus before taking the photo.',
    'Use natural, even light and avoid strong reflections.',
  ].slice(0, 5);

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
          <Ionicons name={model.category === 'crops' ? 'leaf' : 'paw'} size={30} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <AppText variant="largeTitle">{model.name}</AppText>
          <AppText style={{ color: colors.textSecondary }}>{model.subject}{model.disease ? ` · ${model.disease}` : ''}</AppText>
        </View>
      </View>

      <AppCard>
        <AppText variant="headline">Before you take the photo</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          This model expects an image. Follow the capture guidance below to give the inference service the clearest possible input.
        </AppText>
      </AppCard>

      <View style={{ gap: Spacing.sm }}>
        <AppText variant="headline">Reference examples</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {[1, 2, 3].map(index => (
            <View key={index} style={[styles.sample, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="image-outline" size={30} color={colors.textTertiary} />
              <AppText style={{ color: colors.textSecondary }}>Reference {index}</AppText>
              <AppText style={styles.tiny}>Training-image asset</AppText>
            </View>
          ))}
        </ScrollView>
        <AppText style={[styles.tiny, { color: colors.textTertiary }]}>
          These slots are reserved for verified sample images from the model repository; the app will not fabricate training examples.
        </AppText>
      </View>

      <View style={styles.compare}>
        <AppCard style={styles.compareCard}>
          <View style={styles.label}><Ionicons name="checkmark-circle" size={20} color={colors.success} /><AppText variant="headline">Acceptable</AppText></View>
          <View style={[styles.preview, { backgroundColor: colors.primarySubtle }]}><Ionicons name="sunny-outline" size={30} color={colors.primary} /></View>
          <AppText style={{ color: colors.textSecondary }}>Subject visible, sharp detail, useful lighting and enough context for the model.</AppText>
        </AppCard>
        <AppCard style={styles.compareCard}>
          <View style={styles.label}><Ionicons name="close-circle" size={20} color={colors.error} /><AppText variant="headline">Unacceptable</AppText></View>
          <View style={[styles.preview, { backgroundColor: colors.surfaceSecondary }]}><Ionicons name="eye-off-outline" size={30} color={colors.error} /></View>
          <AppText style={{ color: colors.textSecondary }}>Blurred, dark, obstructed, overexposed or too distant from the subject.</AppText>
        </AppCard>
      </View>

      <AppCard>
        <AppText variant="headline">5 ways to get a better diagnosis</AppText>
        <View style={{ gap: Spacing.sm }}>
          {hints.map((hint, index) => (
            <View key={hint} style={styles.tip}>
              <View style={[styles.number, { backgroundColor: colors.primary }]}><AppText style={{ color: '#fff', fontWeight: '800' }}>{index + 1}</AppText></View>
              <AppText style={{ flex: 1 }}>{hint}</AppText>
            </View>
          ))}
        </View>
      </AppCard>

      <AppButton title="Open camera & diagnose" onPress={() => router.push({ pathname: '/scan', params: { modelId: model.id } })} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  carousel: { gap: Spacing.md, paddingRight: Spacing.md },
  sample: { width: 180, height: 145, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 5 },
  tiny: { fontSize: 11, opacity: 0.7 },
  compare: { flexDirection: 'row', gap: Spacing.md },
  compareCard: { flex: 1, gap: Spacing.sm },
  label: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  preview: { height: 110, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  number: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
