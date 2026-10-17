import type { FarmCase } from './caseRepository';

/**
 * A shareable *candidate* observation, prepared only after deliberate farmer
 * action. It is kept privately in the user's Drive-backed case record.
 * NO remote submission, authority notification, map pin or public alert exists.
 */
export type RegionalObservationDraft = {
  status: 'draft_not_shared';
  preparedAt: string;
  district: string;
  subjectType: 'animal' | 'crop' | 'general';
  suspectedCondition: string;
  caseStatus: 'open' | 'monitoring' | 'resolved';
  verification: 'unverified_farmer_observation';
};

export function prepareRegionalObservationDraft(
  record: Pick<FarmCase, 'district' | 'disease' | 'subjectType' | 'animalId' | 'cropId' | 'status' | 'severity'>,
  preparedAt = new Date().toISOString(),
): RegionalObservationDraft {
  const district = record.district?.trim();
  if (!district || district.length < 2) {
    throw new Error('Add your Botswana district to the case before preparing a regional draft.');
  }
  if (!record.disease.trim()) {
    throw new Error('Record the observed health concern before preparing a draft.');
  }
  // Explicitly omit owner/farm/animal IDs, names, GPS, phone and raw images.
  // Any future sharing must additionally check consent and reviewer policies.
  return {
    status: 'draft_not_shared',
    preparedAt,
    district,
    subjectType: record.subjectType ?? (
      record.animalId ? 'animal' :
      record.cropId ? 'crop' : 'general'
    ),
    suspectedCondition: record.disease.trim(),
    caseStatus: record.status,
    verification: 'unverified_farmer_observation',
  };
}
