import type { IntelligenceModel } from './catalog';

/** Explicit metadata is required before third-party pictures become sample cards. */
export type CaptureExample = {
  uri: string;
  title: string;
  sourceUrl: string;
  attribution: string;
  license: string;
  kind: 'verified_training' | 'licensed_reference';
};

const isSafeHttps = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^https:\/\/[a-z0-9][a-z0-9.-]+(?:[:][0-9]+)?(?:[/?#]|$)/i.test(value) &&
  !/[@\\\s]/.test(value);

/**
 * Do not claim that a picture trained a model simply because it appears in a
 * related public dataset. The operator must verify the exact image's training
 * membership and its redistribution rights. Examples are optional.
 */
export function approvedCaptureExamples(raw: unknown): CaptureExample[] {
  if (!Array.isArray(raw)) return [];
  const valid: CaptureExample[] = [];
  for (const item of raw.slice(0, 12)) {
    if (!item || typeof item !== 'object') continue;
    const value = item as Record<string, unknown>;
    if (!isSafeHttps(value.image_url) || !isSafeHttps(value.source_url)) continue;
    if (value.redistribution_allowed !== true ||
        typeof value.attribution !== 'string' || !value.attribution.trim() ||
        typeof value.license !== 'string' || !value.license.trim() ||
        typeof value.title !== 'string' || !value.title.trim()) continue;
    const isTraining = value.kind === 'verified_training' &&
      value.training_membership_verified === true;
    if (!isTraining && value.kind !== 'licensed_reference') continue;
    valid.push({
      uri: value.image_url,
      sourceUrl: value.source_url,
      title: value.title.trim(),
      attribution: value.attribution.trim(),
      license: value.license.trim(),
      kind: isTraining ? 'verified_training' : 'licensed_reference',
    });
    if (valid.length === 3) break;
  }
  return valid;
}

export function captureTips(model: IntelligenceModel): string[] {
  const name = (model.name + ' ' + model.disease).toLowerCase();
  if (model.category === 'livestock') {
    if (/faeces|feces|droppings/.test(name)) return [
      'Photograph one clear sample from directly above in good light.',
      'Keep the entire sample sharp and clearly visible.',
      'Avoid dirt, shadows, reflections and multiple mixed samples.',
      'Do not touch potentially infectious material; follow farm hygiene.',
      'Include animal history in your case notes for professional review.',
    ];
    return [
      'Photograph the affected animal from a safe distance first.',
      'Keep visible lesions or affected body parts sharp and well lit.',
      'Include the affected area and a little surrounding healthy tissue.',
      'Avoid zoom blur, fences, shadows or hidden symptoms.',
      'Do not restrain or approach an unsafe animal for a photograph.',
    ];
  }
  if (model.category === 'pests' || /armyworm|beetle|grasshopper|mite/.test(name)) {
    return [
      'Show the insect or feeding damage clearly, if safely visible.',
      'Keep the camera close enough to see body or damage details.',
      'Take one sharp picture of the affected leaf or plant area.',
      'Use natural light; avoid harsh flash, glare and motion blur.',
      'Do not place a hand near unfamiliar insects or harmful pests.',
    ];
  }
  if (model.category === 'fruits') return [
    'Photograph one affected fruit clearly against a simple background.',
    'Show the damaged part and some surrounding intact fruit surface.',
    'Keep natural colour visible; avoid filters and excessive flash.',
    'Keep the image focused, with the affected area large in the frame.',
    'Record where the fruit was growing and any leaf symptoms in the case.',
  ];
  return [
    'Choose a representative affected leaf or plant part.',
    'Show the whole affected area and some healthy tissue for context.',
    'Bring the camera near enough to see spots, streaks or lesions.',
    'Use natural light, steady focus and true colours; avoid filters.',
    'Photograph the actual plant, not a picture on another screen.',
  ];
}

export const GENERAL_CAPTURE_TIPS = [
  'Clean the camera lens and use daylight.',
  'Hold the phone still until the subject is sharp.',
  'Fill most of the frame with one relevant subject.',
  'Avoid blur, glare, heavy shadows and digital filters.',
  'Retake unclear shots rather than trusting a weak prediction.',
] as const;
