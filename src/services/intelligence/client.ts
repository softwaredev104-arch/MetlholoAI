import type { IntelligenceModel } from './catalog';
import { INTELLIGENCE_SERVICES } from './catalog';

export type PredictionResult = {
  success?: boolean;
  prediction?: string;
  disease?: string;
  class?: string;
  label?: string;
  confidence: number;
  [key: string]: unknown;
};

export function normalizePredictionLabel(result: PredictionResult, model: IntelligenceModel) {
  const raw = String(result.disease ?? result.prediction ?? result.class ?? result.label ?? 'Unknown').trim();
  if (model.id === 'cattle-health-classifier') {
    const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ');
    if (normalized.includes('lumpy')) return 'Lumpy Skin Disease';
    if (normalized.includes('foot') && normalized.includes('mouth')) return 'Foot and Mouth Disease';
    if (normalized === 'healthy' || normalized.includes('normal')) return 'Healthy';
  }
  return raw;
}

export async function predict(model: IntelligenceModel, uri: string): Promise<PredictionResult> {
  const baseUrl = INTELLIGENCE_SERVICES[model.service as keyof typeof INTELLIGENCE_SERVICES];
  if (!baseUrl) throw new Error(`The ${model.service} intelligence service is not configured.`);

  const form = new FormData();
  form.append('image', { uri, name: 'capture.jpg', type: 'image/jpeg' } as unknown as Blob);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${model.predictPath}`, {
    method: 'POST',
    body: form,
  });

  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error ?? 'Prediction service failed.');
  }

  return data as PredictionResult;
}

export async function generateReport(model: IntelligenceModel, input: {
  disease: string;
  confidence: number;
  country: string;
  district?: string;
  cropOrAnimal: string;
}) {
  const baseUrl = INTELLIGENCE_SERVICES[model.service as keyof typeof INTELLIGENCE_SERVICES];
  if (!baseUrl) throw new Error(`The ${model.service} intelligence service is not configured.`);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${model.reportPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error ?? 'Report service failed.');
  }

  return data;
}
