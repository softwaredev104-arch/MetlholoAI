import { listFarmRecords, type Farm, type FarmRecord } from '@/services/farms/farmRepository';
import { listDiagnoses, type DiagnosisRecord } from '@/services/intelligence/diagnosisRepository';
import { listPublishedGuidelines, listPublishedProducts } from '@/services/knowledge/knowledgeRepository';
import type { AgriculturalProduct, CropGuideline } from '@/services/knowledge/models';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationAction = 'task' | 'diagnose' | 'review' | 'record' | 'monitor';
export type FarmRecommendation = { id: string; title: string; summary: string; priority: RecommendationPriority; action: RecommendationAction; assetType?: 'animals' | 'crops'; assetId?: string; assetName?: string; sourceDiagnosisId?: string; evidence: string[]; knowledgeIds: string[]; confidence?: number; createdAt: string; };

function priorityFor(confidence: number, outcome: string): RecommendationPriority {
  const normalized = outcome.toLowerCase();
  if (confidence >= 95 && !['healthy', 'normal'].some(x => normalized.includes(x))) return 'critical';
  if (confidence >= 80 && !['healthy', 'normal'].some(x => normalized.includes(x))) return 'high';
  if (confidence < 70) return 'medium';
  return 'low';
}

function recommendationFromDiagnosis(diagnosis: DiagnosisRecord, guidelines: CropGuideline[], products: AgriculturalProduct[]): FarmRecommendation {
  const priority = priorityFor(diagnosis.confidence, diagnosis.outcome);
  const healthy = ['healthy', 'normal'].some(x => diagnosis.outcome.toLowerCase().includes(x));
  const lowConfidence = diagnosis.confidence < 70;
  const evidence = [
    `${diagnosis.modelName} reported "${diagnosis.outcome}" at ${diagnosis.confidence.toFixed(1)}% confidence.`,
    `Diagnosis is linked to ${diagnosis.sourceName}.`,
  ];
  if (guidelines.length) evidence.push(`${guidelines.length} published guideline${guidelines.length === 1 ? '' : 's'} matched the diagnosis.`);
  if (products.length) evidence.push(`${products.length} published agricultural input${products.length === 1 ? '' : 's'} matched the diagnosis.`);
  return {
    id: `diagnosis-${diagnosis.id}`,
    title: healthy ? `Monitor ${diagnosis.sourceName}` : lowConfidence ? `Review diagnosis for ${diagnosis.sourceName}` : `Follow up on ${diagnosis.outcome} — ${diagnosis.sourceName}`,
    summary: healthy ? 'The model did not identify a disease outcome. Continue monitoring and keep the health record current.' : lowConfidence ? 'Confidence is below the recommendation engine threshold for a strong intervention. Capture another clear image or review with an agricultural professional.' : guidelines.length || products.length ? 'Published knowledge matched this result. Review the evidence and create the appropriate farm task before applying an intervention.' : 'Create a follow-up farm task and review the diagnosis before taking action.',
    priority,
    action: healthy ? 'monitor' : lowConfidence ? 'diagnose' : 'task',
    assetType: diagnosis.sourceRecordType, assetId: diagnosis.sourceRecordId, assetName: diagnosis.sourceName, sourceDiagnosisId: diagnosis.id,
    evidence, knowledgeIds: [...guidelines.map(x => x.id), ...products.map(x => x.id)], confidence: diagnosis.confidence, createdAt: new Date().toISOString(),
  };
}

export async function buildFarmRecommendations(ownerId: string, farm: Farm): Promise<FarmRecommendation[]> {
  const [animals, crops, healthRecords, tasks, feedingPlans, diagnoses] = await Promise.all([
    listFarmRecords(ownerId, farm.id, 'animals'), listFarmRecords(ownerId, farm.id, 'crops'), listFarmRecords(ownerId, farm.id, 'healthRecords'),
    listFarmRecords(ownerId, farm.id, 'tasks'), listFarmRecords(ownerId, farm.id, 'feedingPlans'), listDiagnoses(ownerId, farm.id),
  ]);
  const recommendations: FarmRecommendation[] = [];
  for (const diagnosis of diagnoses.slice(0, 20)) {
    const [guidelines, products] = await Promise.all([
      listPublishedGuidelines(diagnosis.outcome, diagnosis.sourceRecordType === 'crops' ? diagnosis.subject : undefined),
      listPublishedProducts({ targetCrop: diagnosis.sourceRecordType === 'crops' ? diagnosis.subject : undefined, targetSpecies: diagnosis.sourceRecordType === 'animals' ? diagnosis.subject : undefined, disease: diagnosis.outcome, targetPest: diagnosis.outcome }),
    ]);
    recommendations.push(recommendationFromDiagnosis(diagnosis, guidelines, products));
  }
  const openTasks = tasks.filter(item => !['done', 'completed', 'complete'].includes((item.status ?? '').toLowerCase()));
  if (openTasks.length > 0) recommendations.push({ id: 'open-tasks', title: 'Review open farm tasks', summary: `${openTasks.length} task${openTasks.length === 1 ? '' : 's'} still require attention.`, priority: 'medium', action: 'task', evidence: [`${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} are stored for this farm.`], knowledgeIds: [], createdAt: new Date().toISOString() });
  if (animals.length === 0 && crops.length === 0) recommendations.push({ id: 'complete-farm-profile', title: 'Add your first farm asset', summary: 'Add an animal or crop field so MetlholoAI can connect intelligence results to real farm assets.', priority: 'medium', action: 'record', evidence: ['No animal or crop records are currently stored for this farm.'], knowledgeIds: [], createdAt: new Date().toISOString() });
  if (healthRecords.length === 0 && animals.length > 0) recommendations.push({ id: 'health-baseline', title: 'Start an animal health baseline', summary: 'Record health observations for your animals so future diagnoses and recommendations have historical context.', priority: 'low', action: 'record', evidence: [`${animals.length} animal record${animals.length === 1 ? '' : 's'} exist without any health records on the farm.`], knowledgeIds: [], createdAt: new Date().toISOString() });
  if (feedingPlans.length === 0 && animals.length > 0) recommendations.push({ id: 'feeding-baseline', title: 'Add feeding information', summary: 'Record feeding plans to make future livestock recommendations more contextual.', priority: 'low', action: 'record', evidence: [`${animals.length} animal record${animals.length === 1 ? '' : 's'} exist and no feeding plan is recorded.`], knowledgeIds: [], createdAt: new Date().toISOString() });
  const weight: Record<RecommendationPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  return recommendations.sort((a, b) => weight[b.priority] - weight[a.priority]);
}