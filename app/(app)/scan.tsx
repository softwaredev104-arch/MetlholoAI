import { useEffect, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { requestCameraPermission, requestPhotoLibraryPermission } from '@/services/permissions/mobilePermissions';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { INTELLIGENCE_MODELS, type IntelligenceModel } from '@/services/intelligence/catalog';
import { predict, generateReport, type PredictionResult } from '@/services/intelligence/client';
import { Spacing } from '@/design/spacing';
import { resolveDiagnosisReference } from '@/services/knowledge/diagnosisReference';
import type { DiagnosisReference } from '@/services/knowledge/models';
import { AgriculturalInputCard, GuidelineCard } from '@/components/knowledge';

function normalizeConfidence(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return numeric <= 1 ? numeric * 100 : numeric;
}

export default function Scan() {
  const { modelId } = useLocalSearchParams<{ modelId?: string }>();
  const [model, setModel] = useState<IntelligenceModel | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [report, setReport] = useState<unknown>(null);
  const [reference, setReference] = useState<DiagnosisReference | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setModel(INTELLIGENCE_MODELS.find(item => item.id === modelId) ?? INTELLIGENCE_MODELS[0] ?? null);
  }, [modelId]);

  async function choose(source: 'camera' | 'library') {
    const permission = source === 'camera'
      ? await requestCameraPermission()
      : await requestPhotoLibraryPermission();

    if (permission !== 'granted' && permission !== 'limited') {
      Alert.alert(
        source === 'camera' ? 'Camera permission required' : 'Photo permission required',
        source === 'camera'
          ? 'Allow MetlholoAI to use your camera in Settings so you can capture a diagnosis image.'
          : 'Allow MetlholoAI to access your photos in Settings so you can choose a diagnosis image.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
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
    }
  }

  async function runPrediction() {
    if (!uri || !model) return;
    setLoading(true);
    try {
      const result = await predict(model, uri);
      setPrediction(result);
      try {
        const confidence = normalizeConfidence(result.confidence) / 100;
        setReference(await resolveDiagnosisReference({
          prediction: String(result.disease ?? result.prediction ?? 'Unknown'),
          confidence,
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
    if (!prediction || !model) return;
    setLoading(true);
    try {
      const disease = String(prediction.disease ?? prediction.prediction ?? 'Unknown');
      const result = await generateReport(model, {
        disease,
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

  if (!model) {
    return (
      <AppScreen>
        <AppText variant="largeTitle">No intelligence model</AppText>
        <AppText style={styles.muted}>Choose a model from Explore before opening the scanner.</AppText>
        <AppButton title="Explore models" onPress={() => router.replace('/intelligence')} />
      </AppScreen>
    );
  }

  const disease = String(prediction?.disease ?? prediction?.prediction ?? 'No diagnosis yet');
  const confidence = normalizeConfidence(prediction?.confidence);

  return (
    <AppScreen>
      <AppText variant="largeTitle">Diagnose</AppText>
      <AppText style={styles.muted}>{model.subject} · {model.name}</AppText>

      <AppCard>
        <AppText variant="headline">Selected model</AppText>
        <AppText>{model.disease ?? model.name}</AppText>
        <AppText style={styles.muted}>Capture the affected area as clearly as possible. The image is sent directly to the configured inference endpoint.</AppText>
      </AppCard>

      <View style={styles.actions}>
        <AppButton title="Open camera" onPress={() => choose('camera')} />
        <AppButton title="Choose photo" variant="secondary" onPress={() => choose('library')} />
      </View>

      {uri ? <Image source={{ uri }} style={styles.preview} /> : null}
      {uri ? <AppButton title="Run diagnosis" loading={loading} onPress={runPrediction} /> : null}

      {prediction ? (
        <AppCard>
          <AppText variant="headline">Prediction result</AppText>
          <AppText variant="largeTitle">{disease}</AppText>
          <AppText>Confidence: {confidence.toFixed(1)}%</AppText>
          {confidence >= 95 ? (
            <AppText style={styles.highConfidence}>High-confidence result — review the generated report and consider raising a farm alert.</AppText>
          ) : (
            <AppText style={styles.muted}>Below the 95% alert threshold. Treat this result as an indication and review the report carefully.</AppText>
          )}
          <AppButton title="Generate report" loading={loading} onPress={createReport} />
        </AppCard>
      ) : null}

      {reference ? (
        <>
          {reference.guidelines.length > 0 ? (
            <View>
              <AppText variant="headline">Knowledge references</AppText>
              {reference.guidelines.map(item => <GuidelineCard key={item.id} guideline={item} />)}
            </View>
          ) : null}
          {reference.inputs.length > 0 ? (
            <View>
              <AppText variant="headline">Relevant inputs</AppText>
              {reference.inputs.map(item => <AgriculturalInputCard key={item.id} product={item} />)}
            </View>
          ) : null}
        </>
      ) : null}

      {report ? (
        <AppCard>
          <AppText variant="headline">Generated report</AppText>
          {typeof report === 'object' && report !== null
            ? Object.entries(report as Record<string, unknown>).map(([key, value]) => (
                <View key={key} style={styles.reportItem}>
                  <AppText variant="headline">{key.replace(/([A-Z])/g, ' $1')}</AppText>
                  <AppText>{String(value)}</AppText>
                </View>
              ))
            : <AppText>{String(report)}</AppText>}
          <AppText style={styles.muted}>Report persistence, PDF/PowerPoint export, farmer/farm naming and alert creation are the next production phase.</AppText>
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
