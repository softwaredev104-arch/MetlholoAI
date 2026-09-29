import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@/services/permissions/mobilePermissions';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { INTELLIGENCE_MODELS, getModelsForSubject, type IntelligenceModel } from '@/services/intelligence/catalog';
import { predict, generateReport, normalizePredictionLabel, type PredictionResult } from '@/services/intelligence/client';
import { createDiagnosis } from '@/services/intelligence/diagnosisRepository';
import { createFarmRecord, listFarms, listFarmRecords, type FarmRecord } from '@/services/farms/farmRepository';
import { useAuth } from '@/auth/AuthProvider';
import { Spacing } from '@/design/spacing';
import { resolveDiagnosisReference } from '@/services/knowledge/diagnosisReference';
import type { DiagnosisReference } from '@/services/knowledge/models';
import { AgriculturalInputCard, GuidelineCard } from '@/components/knowledge';

function normalizeConfidence(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return numeric <= 1 ? numeric * 100 : numeric;
}

function assetLabel(record: FarmRecord) {
  return record.name || String(record.category ?? 'Farm asset');
}

export default function Scan() {
  const params = useLocalSearchParams<{ modelId?: string; recordType?: 'animals' | 'crops'; recordId?: string }>();
  const { firebaseUser } = useAuth();
  const [farmId, setFarmId] = useState('');
  const [animals, setAnimals] = useState<FarmRecord[]>([]);
  const [crops, setCrops] = useState<FarmRecord[]>([]);
  const [recordType, setRecordType] = useState<'animals' | 'crops' | ''>(params.recordType ?? '');
  const [recordId, setRecordId] = useState(params.recordId ?? '');
  const [modelId, setModelId] = useState(params.modelId ?? '');
  const [uri, setUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [report, setReport] = useState<unknown>(null);
  const [reference, setReference] = useState<DiagnosisReference | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const assets = recordType === 'animals' ? animals : crops;
  const selectedAsset = assets.find(item => item.id === recordId) ?? null;
  const subject = String(selectedAsset?.category ?? selectedAsset?.name ?? '');
  const subjectModels = useMemo(
    () => subject ? getModelsForSubject(subject) : [],
    [subject],
  );
  const model = INTELLIGENCE_MODELS.find(item => item.id === modelId)
    ?? (subjectModels.length === 1 ? subjectModels[0] : null);

  useEffect(() => {
    async function loadAssets() {
      if (!firebaseUser) return;
      const farms = await listFarms(firebaseUser.uid);
      const farm = farms[0];
      if (!farm) return;
      setFarmId(farm.id);
      const [animalRows, cropRows] = await Promise.all([
        listFarmRecords(firebaseUser.uid, farm.id, 'animals'),
        listFarmRecords(firebaseUser.uid, farm.id, 'crops'),
      ]);
      setAnimals(animalRows);
      setCrops(cropRows);
    }
    loadAssets().catch(() => undefined);
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (recordType === 'animals' && !recordId && animals.length === 1) setRecordId(animals[0].id);
    if (recordType === 'crops' && !recordId && crops.length === 1) setRecordId(crops[0].id);
  }, [animals, crops, recordId, recordType]);

  useEffect(() => {
    if (subjectModels.length === 1 && !modelId) setModelId(subjectModels[0].id);
  }, [modelId, subjectModels]);

  async function choose(source: 'camera' | 'library') {
    const permission = source === 'camera'
      ? await requestCameraPermission()
      : await requestPhotoLibraryPermission();

    if (permission !== 'granted' && permission !== 'limited') {
      Alert.alert(
        source === 'camera' ? 'Camera permission required' : 'Photo permission required',
        'Allow MetlholoAI to access the requested media permission in Settings.',
        [{ text: 'Not now', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }],
      );
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });

    const asset = result.canceled ? undefined : result.assets[0];
    if (asset) {
      setUri(asset.uri);
      setPrediction(null);
      setReport(null);
      setReference(null);
      setSaved(false);
    }
  }

  async function runPrediction() {
    if (!uri || !model || !selectedAsset || !firebaseUser) return;
    setLoading(true);
    try {
      const result = await predict(model, uri);
      setPrediction(result);
      const outcome = normalizePredictionLabel(result, model);
      try {
        setReference(await resolveDiagnosisReference({
          prediction: outcome,
          confidence: normalizeConfidence(result.confidence) / 100,
          crop: model.category === 'crops' ? model.subject : undefined,
          livestock: model.category === 'livestock' ? model.subject : undefined,
        }));
      } catch {
        setReference(null);
      }
    } catch (error) {
      Alert.alert('Prediction failed', error instanceof Error ? error.message : 'The intelligence service could not be reached.');
    } finally {
      setLoading(false);
    }
  }

  async function createReport() {
    if (!prediction || !model || !selectedAsset) return;
    setLoading(true);
    try {
      const outcome = normalizePredictionLabel(prediction, model);
      const result = await generateReport(model, {
        disease: outcome,
        confidence: normalizeConfidence(prediction.confidence),
        country: 'Botswana',
        cropOrAnimal: model.subject,
      });
      setReport(result.structuredReport ?? result.report ?? result);
    } catch (error) {
      Alert.alert('Report failed', error instanceof Error ? error.message : 'The report service could not be reached.');
    } finally {
      setLoading(false);
    }
  }

  async function createFollowUpTask() {
    if (!prediction || !model || !selectedAsset || !firebaseUser || !farmId) return;
    setLoading(true);
    try {
      const outcome = normalizePredictionLabel(prediction, model);
      await createFarmRecord(firebaseUser.uid, farmId, 'tasks', {
        name: `Follow up: ${outcome} — ${assetLabel(selectedAsset)}`,
        category: 'Animal health check',
        status: 'open',
        notes: `Created from MetlholoAI diagnosis. Asset: ${assetLabel(selectedAsset)}. Model: ${model.name}. Confidence: ${normalizeConfidence(prediction.confidence).toFixed(1)}%.`,
      } as never);
      Alert.alert('Task created', 'A follow-up farm task was added to your task list.');
    } catch (error) {
      Alert.alert('Could not create task', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function saveDiagnosis() {
    if (!prediction || !model || !selectedAsset || !firebaseUser || !farmId) return;
    setLoading(true);
    try {
      await createDiagnosis({
        ownerId: firebaseUser.uid,
        farmId,
        sourceRecordType: recordType as 'animals' | 'crops',
        sourceRecordId: selectedAsset.id,
        sourceName: assetLabel(selectedAsset),
        modelId: model.id,
        modelName: model.name,
        subject: model.subject,
        outcome: normalizePredictionLabel(prediction, model),
        confidence: normalizeConfidence(prediction.confidence),
        report: report ?? undefined,
        imageUri: uri ?? undefined,
      });
      setSaved(true);
      Alert.alert('Diagnosis saved', `Saved against ${assetLabel(selectedAsset)} in this farm.`);
    } catch (error) {
      Alert.alert('Could not save diagnosis', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!firebaseUser) return null;

  return (
    <AppScreen>
      <AppText variant="largeTitle">Diagnose</AppText>
      <AppText style={styles.muted}>Choose the real farm asset first. Every diagnosis is linked to that animal or crop field.</AppText>

      <OptionPicker
        label="What are you checking?"
        options={[
          { id: 'animals', label: 'Animal' },
          { id: 'crops', label: 'Crop / field' },
        ]}
        selected={recordType}
        onChange={value => { setRecordType(String(value) as 'animals' | 'crops'); setRecordId(''); setModelId(''); }}
        searchable={false}
      />

      {recordType ? (
        <OptionPicker
          label={recordType === 'animals' ? 'Select animal' : 'Select crop / field'}
          options={assets.map(asset => ({
            id: asset.id,
            label: assetLabel(asset),
            description: String(asset.category ?? ''),
          }))}
          selected={recordId}
          onChange={value => { setRecordId(String(value)); setModelId(''); setPrediction(null); setReport(null); }}
        />
      ) : null}

      {selectedAsset && subjectModels.length > 1 ? (
        <OptionPicker
          label="Select intelligence model"
          options={subjectModels.map(item => ({ id: item.id, label: item.name, description: item.disease }))}
          selected={modelId}
          onChange={value => { setModelId(String(value)); setPrediction(null); setReport(null); }}
        />
      ) : null}

      {selectedAsset && model ? (
        <AppCard>
          <AppText variant="headline">{model.subject} intelligence</AppText>
          <AppText>{assetLabel(selectedAsset)} · {model.name}</AppText>
          {model.id === 'cattle-health-classifier' ? (
            <AppText style={styles.muted}>This single cattle model distinguishes Foot and Mouth Disease, Healthy, and Lumpy Skin Disease. The report will name the detected outcome explicitly.</AppText>
          ) : (
            <AppText style={styles.muted}>The selected model will evaluate the image against its configured classes.</AppText>
          )}
        </AppCard>
      ) : null}

      {selectedAsset && model ? (
        <>
          <View style={styles.actions}>
            <AppButton title="Open camera" onPress={() => choose('camera')} />
            <AppButton title="Choose photo" variant="secondary" onPress={() => choose('library')} />
          </View>
          {uri ? <Image source={{ uri }} style={styles.preview} /> : null}
          {uri ? <AppButton title="Run diagnosis" loading={loading} onPress={runPrediction} /> : null}
        </>
      ) : (
        <AppCard>
          <AppText variant="headline">Select an asset to begin</AppText>
          <AppText style={styles.muted}>Create an animal or crop/field in Farm first, then return here to run its configured intelligence model.</AppText>
        </AppCard>
      )}

      {prediction && model ? (
        <AppCard>
          <AppText variant="headline">Prediction for {assetLabel(selectedAsset!)}</AppText>
          <AppText variant="largeTitle">{normalizePredictionLabel(prediction, model)}</AppText>
          <AppText>Confidence: {normalizeConfidence(prediction.confidence).toFixed(1)}%</AppText>
          {model.id === 'cattle-health-classifier' ? (
            <AppText style={styles.muted}>Cattle classifier outcome: FMD, Healthy, or Lumpy Skin Disease. These are kept as distinct report outcomes even though they come from the same model.</AppText>
          ) : null}
          {normalizeConfidence(prediction.confidence) >= 95 ? (
            <AppText style={styles.highConfidence}>High-confidence result — review the generated report and consider creating a follow-up farm task.</AppText>
          ) : (
            <AppText style={styles.muted}>Below the 95% alert threshold. Review the result carefully.</AppText>
          )}
          <View style={styles.actions}>
            <AppButton title="Generate report" loading={loading} onPress={createReport} />
            <AppButton title="Create follow-up task" variant="secondary" loading={loading} onPress={createFollowUpTask} />
            <AppButton title={saved ? 'Diagnosis saved' : 'Save diagnosis'} variant="secondary" loading={loading} disabled={saved} onPress={saveDiagnosis} />
          </View>
        </AppCard>
      ) : null}

      {reference ? (
        <>
          {reference.guidelines.length > 0 ? <View><AppText variant="headline">Knowledge references</AppText>{reference.guidelines.map(item => <GuidelineCard key={item.id} guideline={item} />)}</View> : null}
          {reference.inputs.length > 0 ? <View><AppText variant="headline">Relevant inputs</AppText>{reference.inputs.map(item => <AgriculturalInputCard key={item.id} product={item} />)}</View> : null}
        </>
      ) : null}

      {report ? (
        <AppCard>
          <AppText variant="headline">Generated report — {normalizePredictionLabel(prediction!, model!)}</AppText>
          {typeof report === 'object' && report !== null
            ? Object.entries(report as Record<string, unknown>).map(([key, value]) => <View key={key} style={styles.reportItem}><AppText variant="headline">{key.replace(/([A-Z])/g, ' $1')}</AppText><AppText>{String(value)}</AppText></View>)
            : <AppText>{String(report)}</AppText>}
          <AppText style={styles.muted}>This report is associated with {assetLabel(selectedAsset!)}.</AppText>
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  muted: { opacity: 0.7 },
  actions: { gap: Spacing.md },
  preview: { width: '100%', height: 260, borderRadius: 18 },
  reportItem: { gap: 4, marginTop: Spacing.md },
  highConfidence: { color: '#2F7D4A', fontWeight: '700' },
});
