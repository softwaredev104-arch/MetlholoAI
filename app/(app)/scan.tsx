import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { DrivePhotoThumbnail } from '@/components/farm/RecordPhotoField';
import {
  recordPhotoService,
  uploadRecordPhotos,
  type PendingPhoto,
} from '@/services/drive/recordPhotoService';
import { AppCard } from '@/components/ui/AppCard';
import {
  INTELLIGENCE_MODELS,
  type IntelligenceModel,
} from '@/services/intelligence/catalog';
import {
  predict,
  generateReport,
  listGatewayModels,
  isGatewayConfigured,
  modelReady,
  type PredictionResult,
} from '@/services/intelligence/client';
import {
  createDiagnosis,
  attachDiagnosisReport,
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

type ScanCategory = 'crops' | 'livestock' | 'fruits' | 'soil' | 'pests';

const categoryCards: Array<{
  key: ScanCategory;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'crops', title: 'Crops', subtitle: 'Leaf disease, blight, viruses and crop damage', icon: 'leaf-outline' },
  { key: 'livestock', title: 'Livestock', subtitle: 'Animal disease and visible health symptoms', icon: 'paw-outline' },
  { key: 'fruits', title: 'Fruits', subtitle: 'Orchard fruit and plant health', icon: 'nutrition-outline' },
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
  const [gatewayModels, setGatewayModels] = useState<IntelligenceModel[]>([]);
  const [gatewayError, setGatewayError] = useState('');
  const [lastDiagnosisId, setLastDiagnosisId] = useState('');
  useEffect(() => {
    if (!user || !isGatewayConfigured()) return;
    let active = true;
    listGatewayModels()
      .then(items => {
        if (active) { setGatewayModels(items); setGatewayError(''); }
      })
      .catch(error => {
        if (active) setGatewayError(
          error instanceof Error ? error.message : 'Unable to load local AI models.',
        );
      });
    return () => { active = false; };
  }, [user?.uid]);
  const availableModels = useMemo(
    () => [...INTELLIGENCE_MODELS, ...gatewayModels]
      .filter(item => item.category === category),
    [category, gatewayModels],
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
  const [selectedPhoto, setSelectedPhoto] = useState<PendingPhoto | null>(null);
  const [photoNotice, setPhotoNotice] = useState('');
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
      const asset = result.assets.at(0);
      if (!asset) return;
      setUri(asset.uri);
      setSelectedPhoto({
        uri: asset.uri,
        name: asset.fileName || 'Diagnosis photo.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      });
      setPhotoNotice('');
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
      setLastDiagnosisId('');

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
            crop: model.category !== 'livestock' ? model.subject : undefined,
            livestock:
              model.category === 'livestock' ? model.subject : undefined,
          }),
        );
      } catch {
        setReference(null);
      }

      if (user && farm) {
        const canSaveImage = recordPhotoService.isAvailable();
        const uploaded = canSaveImage && selectedPhoto
          ? await uploadRecordPhotos(
              { ownerId: user.uid, farmId: farm.id, recordType: 'diagnoses' },
              [selectedPhoto],
            )
          : [];
        const saved = await createDiagnosis({
          ownerId: user.uid,
          farmId: farm.id,
          sourceRecordType:
            params.sourceRecordType ??
            (model.category === 'livestock' ? 'animals' : 'crops'),
          sourceRecordId: params.sourceRecordId ?? 'unlinked',
          sourceName: params.sourceName ?? model.subject,
          modelId: model.id,
          modelName: model.name,
          subject: model.subject,
          outcome: predictionOutcome(result, model),
          confidence: normalizedConfidence,
          candidates: result.candidates,
          provider: result.provider ?? model.provider ?? 'legacy',
          modelVersion: result.modelVersion,
          validatedForBotswana: result.validatedForBotswana === true,
          reviewStatus: 'ai_suggestion',
          image: uploaded[0],
        });
        setLastDiagnosisId(saved.id);
        setPhotoNotice(uploaded.length
          ? 'Diagnostic photo stored in your Google Drive.'
          : 'Diagnosis saved, but its photo was not uploaded. Connect Google Drive to preserve future scan photos.');
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
        district: undefined,
        cropOrAnimal: model.subject,
      });
      const generated = result.structuredReport ?? result.report ?? result;
      setReport(generated);
      if (user && farm && lastDiagnosisId) {
        await attachDiagnosisReport(user.uid, farm.id, lastDiagnosisId, generated);
        await loadRecent();
      }
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
    setSelectedPhoto(null);
    setPhotoNotice('');
    setPrediction(null);
    setReport(null);
    setReference(null);
    setLastDiagnosisId('');
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
          const supported = item.key !== 'soil' && (item.key === 'crops' || item.key === 'livestock' || gatewayModels.some(model => model.category === item.key));
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

      {category === 'soil' || availableModels.length === 0 ? (
        <AppCard>
          <AppText variant="headline">This model family is not connected yet</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            The model family remains unavailable until a licensed model and working inference service are installed. Existing scans and farm records are unaffected.
          </AppText>
        </AppCard>
      ) : (
        <>
          {gatewayError ? (
            <AppCard>
              <AppText style={{ color: colors.textSecondary }}>Local model service: {gatewayError}</AppText>
            </AppCard>
          ) : null}
          <View style={styles.section}>
            <AppText variant="headline">
              Choose {category === 'livestock' ? 'animal' : category === 'pests' ? 'pest host' : category === 'fruits' ? 'fruit' : 'crop'}
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
              <StatusPill label={model.provider === 'gateway'
                ? 'In-project AI model'
                : 'Existing AI service'} tone="info" />
              {!modelReady(model) ? (
                <StatusPill label="Not configured" tone="warning" />
              ) : null}
              <AppText variant="footnote" style={{ color: colors.textSecondary }}>
                AI suggestions are not confirmed diagnoses or official outbreak alerts.
              </AppText>
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
          {uri && !recordPhotoService.isAvailable() ? (
            <AppText style={{ color: colors.warning }}>
              Google Drive is disconnected. Diagnosis results can still be saved, but the image will not be available on another device.
            </AppText>
          ) : null}

          {uri && model ? (
            <AppButton
              title="Run Diagnosis"
              icon="scan-outline"
              loading={loading}
              disabled={!modelReady(model)}
              onPress={runPrediction}
            />
          ) : null}
        </>
      )}

      {photoNotice ? (
        <AppText style={{ color: colors.textSecondary }}>{photoNotice}</AppText>
      ) : null}

      {prediction && model ? (
        <AppCard>
          <StatusPill label="AI-suggested finding · not confirmed" tone="warning" />
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
          {lastDiagnosisId ? (
            <AppButton
              title="Create farm case from this finding"
              variant="secondary"
              icon="document-text-outline"
              onPress={() => router.push({
                pathname: '/(app)/case/new' as any,
                params: { diagnosisId: lastDiagnosisId },
              })}
            />
          ) : null}
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
              {item.image ? (
                <DrivePhotoThumbnail
                  context={{ ownerId: user?.uid ?? '', farmId: farm?.id ?? '', recordType: 'diagnoses' }}
                  photo={item.image}
                  width={58}
                  height={58}
                />
              ) : null}
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
