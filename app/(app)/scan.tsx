import { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { INTELLIGENCE_MODELS, type IntelligenceModel } from '@/services/intelligence/catalog';
import { predict, generateReport, type PredictionResult } from '@/services/intelligence/client';
import { Spacing } from '@/design/spacing';

export default function Scan() {
  const [model, setModel] = useState<IntelligenceModel>(INTELLIGENCE_MODELS[0]);
  const [uri, setUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function choose(source: 'camera' | 'library') {
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });

    if (!result.canceled) {
      setUri(result.assets[0].uri);
      setPrediction(null);
      setReport(null);
    }
  }

  async function runPrediction() {
    if (!uri) return;
    setLoading(true);
    try {
      const result = await predict(model, uri);
      setPrediction(result);
    } catch (error) {
      Alert.alert('Prediction failed', error instanceof Error ? error.message : 'The intelligence service could not be reached.');
    } finally {
      setLoading(false);
    }
  }

  async function createReport() {
    if (!prediction) return;
    setLoading(true);
    try {
      const disease = String(prediction.disease ?? prediction.prediction ?? 'Unknown');
      const result = await generateReport(model, {
        disease,
        confidence: Number(prediction.confidence ?? 0),
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

  return (
    <AppScreen>
      <AppText variant="largeTitle">Scan & diagnose</AppText>
      <AppText style={styles.muted}>Capture a clear image, run the selected model, then generate the agricultural report.</AppText>

      <AppCard>
        <AppText variant="headline">{model.subject} · {model.name}</AppText>
        <AppText style={styles.muted}>Model input is a single image. The existing services resize images to 224 × 224 before inference.</AppText>
      </AppCard>

      <View style={styles.actions}>
        <AppButton title="Open camera" onPress={() => choose('camera')} />
        <AppButton title="Choose photo" variant="secondary" onPress={() => choose('library')} />
      </View>

      {uri ? <Image source={{ uri }} style={styles.preview} /> : null}

      {uri ? <AppButton title="Run diagnosis" loading={loading} onPress={runPrediction} /> : null}

      {prediction ? (
        <AppCard>
          <AppText variant="headline">Diagnosis</AppText>
          <AppText variant="largeTitle">{String(prediction.disease ?? prediction.prediction ?? 'Unknown')}</AppText>
          <AppText>Confidence: {Number(prediction.confidence ?? 0).toFixed(2)}%</AppText>
          <AppButton title="Generate report" loading={loading} onPress={createReport} />
        </AppCard>
      ) : null}

      {report ? (
        <AppCard>
          <AppText variant="headline">Generated report</AppText>
          {typeof report === 'object' ? Object.entries(report).map(([key, value]) => (
            <View key={key} style={styles.reportItem}>
              <AppText variant="headline">{key.replace(/([A-Z])/g, ' $1')}</AppText>
              <AppText>{String(value)}</AppText>
            </View>
          )) : <AppText>{String(report)}</AppText>}
          <AppText style={styles.muted}>Saving, alert escalation at ≥95%, PDF/PowerPoint export and farm-owner naming are implemented in the report persistence phase.</AppText>
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
});
