import { Platform } from 'react-native';
import { getFirebaseAuth } from '@/services/firebase/client';
import type { IntelligenceModel, IntelligenceCategory } from './catalog';
import { INTELLIGENCE_SERVICES, gatewayModel } from './catalog';
import { approvedCaptureExamples } from './captureGuidance';

const gatewayBase = (process.env.EXPO_PUBLIC_AI_GATEWAY_URL ?? '').trim().replace(/\/$/, '');

export type PredictionResult = {
  success?: boolean;
  prediction?: string;
  disease?: string;
  confidence: number;
  candidates?: Array<{ label: string; confidence: number }>;
  modelId?: string;
  modelVersion?: string;
  provider?: string;
  uncertain?: boolean;
  validatedForBotswana?: boolean;
  reviewRequired?: boolean;
  status?: string;
  [key: string]: unknown;
};

async function firebaseHeaders(): Promise<Record<string, string>> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Sign in to MetlholoAI to run diagnostics.');
  return { Authorization: 'Bearer ' + await user.getIdToken() };
}

function normalizeConfidence(raw: number): number {
  const value = raw > 1 ? raw / 100 : raw;
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function normalizePrediction(value: PredictionResult): PredictionResult {
  const confidence = normalizeConfidence(Number(value.confidence));
  if (!Number.isFinite(Number(value.confidence))) {
    throw new Error('The model returned an invalid confidence score.');
  }
  return { ...value, confidence };
}

async function uploadedImage(uri: string): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // Browser FormData needs a genuine File/Blob, not React Native's URI object.
    const image = await fetch(uri);
    if (!image.ok) throw new Error('The selected image could not be read.');
    const blob = await image.blob();
    if (!blob.type.startsWith('image/')) {
      throw new Error('Please select a valid image.');
    }
    form.append('image', blob, 'capture.jpg');
  } else {
    form.append('image', {
      uri, name: 'capture.jpg', type: 'image/jpeg',
    } as unknown as Blob);
  }
  return form;
}

async function responseJson(response: Response, label: string) {
  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    throw new Error(label + ' returned an unreadable response.');
  }
  if (!response.ok || data?.success === false) {
    throw new Error(
      typeof data?.detail === 'string' ? data.detail :
      typeof data?.error === 'string' ? data.error :
      label + ' failed (' + response.status + ').',
    );
  }
  return data;
}

export async function listGatewayModels(): Promise<IntelligenceModel[]> {
  if (!gatewayBase) return [];
  const response = await fetch(gatewayBase + '/v1/models', {
    headers: await firebaseHeaders(),
  });
  const data = await responseJson(response, 'Model catalogue');
  if (!Array.isArray(data.models)) throw new Error('Model catalogue is invalid.');
  const categories: IntelligenceCategory[] = ['crops', 'livestock', 'fruits', 'pests'];
  return data.models
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null &&
      typeof item.id === 'string' && typeof item.name === 'string' &&
      typeof item.subject === 'string' && categories.includes(item.category as IntelligenceCategory) &&
      item.ready === true)
    .map(item => gatewayModel({
      id: item.id as string, name: item.name as string,
      category: item.category as IntelligenceCategory,
      subject: item.subject as string, ready: true,
      validated_for_botswana: item.validated_for_botswana === true,
      review_required: item.review_required !== false,
      captureExamples: approvedCaptureExamples(item.capture_examples),
    }));
}

export function isGatewayConfigured() {
  return Boolean(gatewayBase);
}

export function modelReady(model: IntelligenceModel) {
  if (model.provider === 'gateway') return !!gatewayBase && model.configured === true;
  return Boolean(
    INTELLIGENCE_SERVICES[model.service as keyof typeof INTELLIGENCE_SERVICES],
  );
}

export async function predict(model: IntelligenceModel, uri: string): Promise<PredictionResult> {
  const form = await uploadedImage(uri);
  if (model.provider === 'gateway') {
    if (!modelReady(model)) throw new Error('This model is not installed on the diagnostic server.');
    form.append('model_id', model.id);
    const response = await fetch(gatewayBase + model.predictPath, {
      method: 'POST', headers: await firebaseHeaders(), body: form,
    });
    const data = await responseJson(response, 'Diagnostic inference');
    return normalizePrediction(data as PredictionResult);
  }

  const baseUrl = INTELLIGENCE_SERVICES[model.service as keyof typeof INTELLIGENCE_SERVICES];
  if (!baseUrl) throw new Error('The ' + model.service + ' intelligence service is not configured.');
  const response = await fetch(baseUrl.replace(/\/$/, '') + model.predictPath, {
    method: 'POST', body: form,
  });
  return normalizePrediction((await responseJson(response, 'Legacy prediction')) as PredictionResult);
}

export async function generateReport(model: IntelligenceModel, input: {
  disease: string;
  confidence: number;
  country: string;
  district?: string;
  cropOrAnimal: string;
}) {
  if (model.provider === 'gateway') {
    if (!modelReady(model)) throw new Error('This model is not installed on the diagnostic server.');
    const response = await fetch(gatewayBase + model.reportPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...await firebaseHeaders() },
      body: JSON.stringify({ ...input, confidence: normalizeConfidence(input.confidence), modelId: model.id }),
    });
    return responseJson(response, 'Diagnostic report');
  }

  const baseUrl = INTELLIGENCE_SERVICES[model.service as keyof typeof INTELLIGENCE_SERVICES];
  if (!baseUrl) throw new Error('The ' + model.service + ' intelligence service is not configured.');
  const response = await fetch(baseUrl.replace(/\/$/, '') + model.reportPath, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return responseJson(response, 'Legacy report');
}
