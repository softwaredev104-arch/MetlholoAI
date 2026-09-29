import { listPublishedGuidelines, listPublishedProducts } from './knowledgeRepository';
import type { DiagnosisReference } from './models';

export async function resolveDiagnosisReference(input: {
  prediction: string;
  confidence: number;
  crop?: string;
  livestock?: string;
}): Promise<DiagnosisReference> {
  const [guidelines, inputs] = await Promise.all([
    listPublishedGuidelines(input.prediction, input.crop),
    listPublishedProducts({
      targetCrop: input.crop,
      targetSpecies: input.livestock,
      disease: input.prediction,
      targetPest: input.prediction,
    }),
  ]);
  return { ...input, guidelines, inputs };
}
