import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader, StatusPill } from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';
import type { IntelligenceModel, IntelligenceCategory } from '@/services/intelligence/catalog';
import { captureTips, GENERAL_CAPTURE_TIPS } from '@/services/intelligence/captureGuidance';
import { ReferencePhotoViewer } from '@/components/intelligence/ReferencePhotoViewer';

type VisualKind = IntelligenceCategory;
const iconByKind: Record<VisualKind, keyof typeof Ionicons.glyphMap> = {
  crops: 'leaf-outline', livestock: 'paw-outline',
  fruits: 'nutrition-outline', pests: 'bug-outline',
};

/** Offline-capable framing diagrams; never presented as actual training photos. */
function FramingIllustration({ kind, acceptable }: { kind: VisualKind; acceptable: boolean }) {
  const { colors } = useTheme();
  const tint = acceptable ? colors.success : colors.error;
  return (
    <View
      accessible
      accessibilityLabel={acceptable
        ? 'Illustration: sharp, centred subject with enough light'
        : 'Illustration: distant, obscured and poorly lit subject'}
      style={[styles.visual, { backgroundColor: colors.surfaceSecondary, borderColor: tint }]}
    >
      <View style={[styles.viewfinder, {
        borderColor: tint,
        opacity: acceptable ? 1 : 0.45,
        transform: [{ rotate: acceptable ? '0deg' : '-12deg' }],
      }]}>
        <Ionicons
          name={iconByKind[kind]}
          size={acceptable ? 72 : 38}
          color={acceptable ? colors.primary : colors.textTertiary}
        />
      </View>
      {!acceptable ? <View style={styles.obstruction} /> : null}
      <View style={[styles.visualTag, { backgroundColor: tint }]}>
        <Ionicons name={acceptable ? 'checkmark' : 'close'} size={17} color="#FFFFFF" />
        <AppText variant="caption" style={styles.white}>
          {acceptable ? 'IN FOCUS' : 'RETAKE'}
        </AppText>
      </View>
    </View>
  );
}

function Comparison({ kind }: { kind: VisualKind }) {
  const { colors } = useTheme();
  return (
    <View style={styles.compare}>
      <AppCard style={styles.compareCard}>
        <FramingIllustration kind={kind} acceptable />
        <AppText variant="headline">Acceptable framing</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Subject fills the frame; details are visible and well lit.
        </AppText>
      </AppCard>
      <AppCard style={styles.compareCard}>
        <FramingIllustration kind={kind} acceptable={false} />
        <AppText variant="headline">Retake this photo</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Too distant, blurry, shaded or obstructed.
        </AppText>
      </AppCard>
    </View>
  );
}

export function ScanWelcomeGuide({ onContinue }: { onContinue: () => void }) {
  const { colors } = useTheme();
  return (
    <>
      <SectionHeader
        title="Take a better diagnostic photo"
        subtitle="First, learn how to photograph a symptom clearly. Then choose a crop, animal, fruit or pest."
      />
      <AppCard>
        <StatusPill label="Step 1 of 2 · Camera basics" tone="info" />
        <AppText variant="headline">A clear photograph helps the model see more useful detail.</AppText>
        <View style={styles.iconGrid}>
          {([
            ['crops', 'Leaf or crop'],
            ['livestock', 'Animal'],
            ['fruits', 'Fruit'],
            ['pests', 'Insect or damage'],
          ] as Array<[VisualKind, string]>).map(([kind, title]) => (
            <View key={kind} style={[styles.iconCard, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name={iconByKind[kind]} color={colors.primary} size={32} />
              <AppText variant="caption">{title}</AppText>
            </View>
          ))}
        </View>
      </AppCard>
      <Comparison kind="crops" />
      <AppCard>
        <AppText variant="headline">Five quick photography checks</AppText>
        {GENERAL_CAPTURE_TIPS.map((tip, i) => (
          <View key={tip} style={styles.tip}>
            <Ionicons name="checkmark-circle-outline" size={21} color={colors.primary} />
            <AppText style={styles.tipText}>{i + 1}. {tip}</AppText>
          </View>
        ))}
        <AppText style={{ color: colors.textSecondary }}>
          These are framing illustrations, not photographs used to train a model.
          Model-specific training pictures appear only when their provenance and usage rights are confirmed.
        </AppText>
      </AppCard>
      <AppButton title="I understand · Choose what to scan" onPress={onContinue} icon="arrow-forward-outline" />
    </>
  );
}

export function ModelCaptureGuide({
  model, onContinue, onChangeModel,
}: { model: IntelligenceModel; onContinue: () => void; onChangeModel?: () => void }) {
  const { colors } = useTheme();
  const photos = model.captureExamples ?? [];
  const tips = captureTips(model);
  const { width } = useWindowDimensions();
  const [openPhoto, setOpenPhoto] = useState<number | null>(null);
  return (
    <>
      <SectionHeader
        title={model.subject + ' photo guide'}
        subtitle={'Specific camera guidance for ' + model.name + '. Review this before opening the camera or uploading a photo.'}
      />
      <StatusPill label="Step 2 of 2 · Model guidance" tone="info" />
      {photos.length ? (
        <>
          <AppCard>
            <AppText variant="headline">Photo examples to guide your shot</AppText>
            <AppText style={{ color: colors.textSecondary }}>
              Tap any image to inspect it full screen, zoom in and compare details.
              These are visual references, not proof of what a specific model was trained on.
              Controlled-background examples can differ from real farm conditions.
            </AppText>
          </AppCard>
          <View style={styles.gallery}>
            {photos.map((photo, index) => (
              <Pressable
                key={photo.uri}
                accessibilityRole="button"
                accessibilityLabel={`Open reference photo ${index + 1} full screen`}
                accessibilityHint="Opens an enlarged image viewer with image details"
                onPress={() => setOpenPhoto(index)}
                style={styles.samplePressable}
              >
                <AppCard style={styles.sample}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={[styles.sampleImage, {
                      height: Math.max(285, Math.min(460, width * 0.85)),
                    }]}
                    resizeMode="contain"
                    accessibilityLabel={`Reference photo ${index + 1}`}
                  />
                  <View style={styles.photoRow}>
                    <AppText variant="headline">{`Reference photo ${index + 1}`}</AppText>
                    <Ionicons name="expand-outline" color={colors.primary} size={24} />
                  </View>
                  <AppText style={{ color: colors.textSecondary }}>
                    Tap to enlarge and inspect the visible details.
                  </AppText>
                </AppCard>
              </Pressable>
            ))}
          </View>
          <ReferencePhotoViewer
            photos={photos}
            initialIndex={openPhoto ?? 0}
            visible={openPhoto !== null}
            onClose={() => setOpenPhoto(null)}
          />
        </>
      ) : (
        <AppCard>
          <AppText variant="headline">Visual training examples unavailable</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            This model does not yet have verified, reusable photographs.
            Follow the camera framing examples and capture tips below.
          </AppText>
        </AppCard>
      )}
      <Comparison kind={model.category} />
      <AppCard>
        <AppText variant="headline">Five tips for {model.subject}</AppText>
        {tips.map((tip, i) => (
          <View key={tip} style={styles.tip}>
            <Ionicons name="camera-outline" color={colors.primary} size={21} />
            <AppText style={styles.tipText}>{i + 1}. {tip}</AppText>
          </View>
        ))}
        <AppText style={{ color: colors.textSecondary }}>
          The model can still be mistaken with a good photograph. Results are unverified AI suggestions, not official diagnoses.
        </AppText>
      </AppCard>
      <AppButton title="I understand · Open camera options" onPress={onContinue} icon="camera-outline" />
      {onChangeModel ? (
        <AppButton title="Choose another model" variant="secondary" onPress={onChangeModel} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  visual: {
    height: 164, borderRadius: 16, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  viewfinder: {
    width: '66%', height: 122, borderWidth: 2, borderStyle: 'dashed',
    borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  obstruction: {
    position: 'absolute', width: '120%', height: 38,
    backgroundColor: '#64748B77', transform: [{ rotate: '-16deg' }],
  },
  visualTag: {
    position: 'absolute', bottom: 9, right: 9,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: 9, borderRadius: 10,
  },
  white: { color: '#FFFFFF', fontWeight: '700' },
  compare: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  compareCard: { flex: 1, minWidth: 220, gap: Spacing.sm },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconCard: {
    minWidth: 126, flex: 1, minHeight: 106, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tipText: { flex: 1 },
  gallery: { gap: Spacing.md, width: '100%' },
  samplePressable: { width: '100%' },
  sample: { width: '100%', gap: Spacing.sm },
  sampleImage: { width: '100%', borderRadius: 12, backgroundColor: '#151915' },
  photoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
