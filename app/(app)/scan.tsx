import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import {
  INTELLIGENCE_MODELS,
  type IntelligenceCategory,
  type IntelligenceModel,
} from '@/services/intelligence/catalog';
import {
  predict,
  generateReport,
  type PredictionResult,
} from '@/services/intelligence/client';
import {
  createDiagnosis,
  listDiagnoses,
  predictionOutcome,
  type DiagnosisRecord,
} from '@/services/intelligence/diagnosisRepository';
import { resolveDiagnosisReference } from '@/services/knowledge/diagnosisReference';
import type { DiagnosisReference } from '@/services/knowledge/models';
import { AgriculturalInputCard, GuidelineCard } from '@/components/knowledge';
import { ChoiceChip, SectionHeader, StatusPill } from '@/components/app/ProductUI';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

type ScanCategory = 'crops' | 'livestock' | 'soil' | 'pests';

const categoryCards: Array<{
  key: ScanCategory;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'crops', title: 'Crops', subtitle: 'Leaf disease, blight, viruses and crop damage', icon: 'leaf-outline' },
  { key: 'livestock', title: 'Livestock', subtitle: 'Animal disease and visible health symptoms', icon: 'paw-outline' },
  { key: 'soil', title: 'Soil', subtitle: 'Nutrient and soil workflows', icon: 'earth-outline' },
  { key: 'pests', title: 'Pests', subtitle: 'Insect and infestation workflows', icon: 'bug-outline' },
];

export default function Scan() {
  const params = useLocalSearchParams<{
    sourceRecordType?: 'animals' | 'crops';
    sourceRecordId?: string;
    sourceName?: string;
  }>();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();

  const [category, setCategory] = useState<ScanCategory>(
    params.sourceRecordType === 'animals'
      ? 'livestock'
      : params.sourceRecordType === 'crops'
        ? 'crops'
        : 'crops',
  );
  const availableModels = useMemo(
    () =>
      category === 'crops' || category === 'livestock'
        ? INTELLIGENCE_MODELS.filter(model => model.category === category)
        : [],
    [category],
  );
  const subjects = useMemo(
    () => Array.from(new Set(availableModels.map(model => model.subject))),
    [availableModels],
  );
  const [subject, setSubject] = useState<string>(
    params.sourceName && availableModels.some(model => model.subject === params.sourceName)
      ? params.sourceName
      : subjects.at(0) ?? '',
  );
  const subjectModels = useMemo(
    () => availableModels.filter(model => !subject || model.subject === subject),
    [availableModels, subject],
  );
  const [modelId, setModelId] = useState<string>(subjectModels.at(0)?.id ?? '');
  const model: IntelligenceModel | undefined =
    subjectModels.find(item => item.id === modelId) ?? subjectModels[0];

  const [uri, setUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [report, setReport] = useState<any>(null);
  const [reference, setReference] = useState<DiagnosisReference | null>(null);
  const [recent, setRecent] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subjectModels.length) {
      setModelId('');
      return;
    }
    if (!subjectModels.some(item => item.id === modelId)) {
      setModelId(subjectModels.at(0)?.id ?? '');
    }
  }, [subject, category, subjectModels.length]);

  useEffect(() => {
    if (!subjects.includes(subject)) {
      setSubject(subjects.at(0) ?? '');
    }
  }, [category, subjects.join('|')]);

  async function loadRecent() {
    if (!user || !farm) return;
    setRecent((await listDiagnoses(user.uid, farm.id)).slice(0, 4));
  }

  useEffect(() => {
    void loadRecent();
  }, [user?.uid, farm?.id]);

  async function choose(source: 'camera' | 'library') {
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.9,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.9,
          });

    if (!result.canceled) {
      setUri(result.assets[0].uri);
      setPrediction(null);
      setReport(null);
      setReference(null);
    }
  }

  async function runPrediction() {
    if (!uri || !model) return;
    setLoading(true);

    try {
      const result = await predict(model, uri);
      setPrediction(result);

      const rawConfidence = Number(result.confidence ?? 0);
      const normalizedConfidence =
        rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;

      try {
        setReference(
          await resolveDiagnosisReference({
            prediction: String(
              result.disease ?? result.prediction ?? 'Unknown',
            ),
            confidence: Math.max(0, Math.min(1, normalizedConfidence)),
            crop: model.category === 'crops' ? model.subject : undefined,
            livestock:
              model.category === 'livestock' ? model.subject : undefined,
          }),
        );
      } catch {
        setReference(null);
      }

      if (user && farm) {
        await createDiagnosis({
          ownerId: user.uid,
          farmId: farm.id,
          sourceRecordType:
            params.sourceRecordType ??
            (model.category === 'crops' ? 'crops' : 'animals'),
          sourceRecordId: params.sourceRecordId ?? 'unlinked',
          sourceName: params.sourceName ?? model.subject,
          modelId: model.id,
          modelName: model.name,
          subject: model.subject,
          outcome: predictionOutcome(result, model),
          confidence: normalizedConfidence,
          imageUri: uri,
        });
        await loadRecent();
      }
    } catch (error) {
      Alert.alert(
        'Prediction failed',
        error instanceof Error
          ? error.message
          : 'The intelligence service could not be reached.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function createReport() {
    if (!prediction || !model) return;
    setLoading(true);

    try {
      const disease = String(
        prediction.disease ?? prediction.prediction ?? 'Unknown',
      );
      const result = await generateReport(model, {
        disease,
        confidence: Number(prediction.confidence ?? 0),
        country: 'Botswana',
        cropOrAnimal: model.subject,
      });
      setReport(result.structuredReport ?? result.report ?? result);
    } catch (error) {
      Alert.alert(
        'Report failed',
        error instanceof Error
          ? error.message
          : 'The report service could not be reached.',
      );
    } finally {
      setLoading(false);
    }
  }

  function selectCategory(next: ScanCategory) {
    setCategory(next);
    setUri(null);
    setPrediction(null);
    setReport(null);
    setReference(null);
  }

  return (
    <AppScreen maxWidth={980}>
      <SectionHeader
        title="New Scan"
        subtitle="What would you like to scan?"
      />

      {params.sourceName ? (
        <AppCard>
          <AppText variant="headline">Linked farm record</AppText>
          <View style={styles.pills}>
            <StatusPill label={params.sourceName} tone="info" />
            <StatusPill
              label={params.sourceRecordType === 'animals' ? 'Animal' : 'Crop'}
            />
          </View>
        </AppCard>
      ) : null}

      <View style={styles.categoryGrid}>
        {categoryCards.map(item => {
          const selected = category === item.key;
          const supported = item.key === 'crops' || item.key === 'livestock';
          return (
            <AppCard
              key={item.key}
              onPress={() => selectCategory(item.key)}
              style={[
                styles.categoryCard,
                selected ? { borderColor: colors.primary } : undefined,
              ]}
            >
              <View
                style={[
                  styles.categoryIcon,
                  {
                    backgroundColor: selected
                      ? colors.primarySubtle
                      : colors.surfaceSecondary,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={28}
                  color={supported ? colors.primary : colors.textTertiary}
                />
              </View>
              <AppText variant="headline">{item.title}</AppText>
              <AppText variant="footnote" style={{ color: colors.textSecondary }}>
                {item.subtitle}
              </AppText>
              {!supported ? (
                <StatusPill label="Model not connected yet" />
              ) : null}
            </AppCard>
          );
        })}
      </View>

      {category === 'soil' || category === 'pests' ? (
        <AppCard>
          <AppText variant="headline">This model family is not connected yet</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            The screen is implemented from the product specification, but MetlholoAI will only enable diagnosis when a real soil or pest endpoint is configured.
          </AppText>
        </AppCard>
      ) : (
        <>
          <View style={styles.section}>
            <AppText variant="headline">
              Choose {category === 'crops' ? 'crop' : 'animal'}
            </AppText>
            <View style={styles.pills}>
              {subjects.map(item => (
                <ChoiceChip
                  key={item}
                  label={item}
                  selected={subject === item}
                  onPress={() => setSubject(item)}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="headline">Diagnostic model</AppText>
            <View style={styles.pills}>
              {subjectModels.map(item => (
                <ChoiceChip
                  key={item.id}
                  label={item.name}
                  selected={model?.id === item.id}
                  onPress={() => setModelId(item.id)}
                />
              ))}
            </View>
          </View>

          {model ? (
            <AppCard>
              <StatusPill label="AI Diagnostic Tip" tone="info" />
              <AppText variant="headline">{model.subject} · {model.name}</AppText>
              <AppText style={{ color: colors.textSecondary }}>
                Use a well-lit, sharp image and keep the affected area clearly visible.
              </AppText>
              <View style={styles.pills}>
                {model.trainingImageHints.map(hint => (
                  <StatusPill key={hint} label={hint} />
                ))}
              </View>
            </AppCard>
          ) : null}

          <View style={styles.actions}>
            <AppButton
              title="Open Camera"
              icon="camera-outline"
              onPress={() => choose('camera')}
            />
            <AppButton
              title="Choose Photo"
              icon="images-outline"
              variant="secondary"
              onPress={() => choose('library')}
            />
          </View>

          {uri ? <Image source={{ uri }} style={styles.preview} /> : null}

          {uri && model ? (
            <AppButton
              title="Run Diagnosis"
              icon="scan-outline"
              loading={loading}
              onPress={runPrediction}
            />
          ) : null}
        </>
      )}

      {prediction && model ? (
        <AppCard>
          <StatusPill label="Diagnosis" tone="success" />
          <AppText variant="largeTitle">
            {String(
              prediction.disease ?? prediction.prediction ?? 'Unknown',
            )}
          </AppText>
          <AppText>
            Confidence: {Number(prediction.confidence ?? 0).toFixed(2)}
            {Number(prediction.confidence ?? 0) <= 1 ? '' : '%'}
          </AppText>
          <AppButton
            title="Generate Report"
            loading={loading}
            onPress={createReport}
          />
        </AppCard>
      ) : null}

      {reference ? (
        <>
          {reference.guidelines.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="headline">Knowledge references</AppText>
              {reference.guidelines.map(item => (
                <GuidelineCard key={item.id} guideline={item} />
              ))}
            </View>
          ) : null}
          {reference.inputs.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="headline">Relevant inputs</AppText>
              {reference.inputs.map(item => (
                <AgriculturalInputCard key={item.id} product={item} />
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {report ? (
        <AppCard>
          <AppText variant="title2">Generated report</AppText>
          {typeof report === 'object' ? (
            Object.entries(report).map(([key, value]) => (
              <View key={key} style={styles.reportItem}>
                <AppText variant="headline">
                  {key.replace(/([A-Z])/g, ' $1')}
                </AppText>
                <AppText>{String(value)}</AppText>
              </View>
            ))
          ) : (
            <AppText>{String(report)}</AppText>
          )}
        </AppCard>
      ) : null}

      <SectionHeader title="Recent Diagnoses" />
      {recent.length === 0 ? (
        <AppCard>
          <AppText style={{ color: colors.textSecondary }}>
            No saved diagnoses yet.
          </AppText>
        </AppCard>
      ) : (
        recent.map(item => (
          <AppCard key={item.id}>
            <View style={styles.recentRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="headline">{item.sourceName}</AppText>
                <AppText style={{ color: colors.textSecondary }}>
                  {item.subject + ' · ' + item.outcome}
                </AppText>
              </View>
              <StatusPill
                label={Math.round(item.confidence * 100) + '%'}
                tone="success"
              />
            </View>
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    minWidth: 210,
    flex: 1,
    minHeight: 170,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: Spacing.sm },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actions: { gap: Spacing.sm },
  preview: { width: '100%', height: 320, borderRadius: 20 },
  reportItem: { gap: 4, marginTop: Spacing.md },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
