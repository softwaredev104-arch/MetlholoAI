import type { FarmCase } from './caseRepository';

/**
 * Private review preparation only. Not a dispatched consultation or a
 * professional diagnosis. A separate explicitly consented provider workflow
 * is required before any case data is transmitted.
 */
export type ProfessionalReviewDraft = {
  status: 'draft_not_sent';
  preparedAt: string;
  symptoms: string;
  sourceDiagnosisId?: string;
};

export function prepareProfessionalReviewDraft(
  record: Pick<FarmCase, 'symptoms' | 'notes' | 'sourceDiagnosisId'>,
  preparedAt = new Date().toISOString(),
): ProfessionalReviewDraft {
  // Existing cases stored before the dedicated symptoms field used notes.
  const symptoms = (record.symptoms?.trim() || record.notes?.trim() || '');
  if (symptoms.length < 5) {
    throw new Error('Record observed symptoms in the case before preparing a professional review draft.');
  }
  return {
    status: 'draft_not_sent',
    preparedAt,
    symptoms,
    ...(record.sourceDiagnosisId ? { sourceDiagnosisId: record.sourceDiagnosisId } : {}),
  };
}
