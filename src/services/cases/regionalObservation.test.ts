import { prepareRegionalObservationDraft } from './regionalObservation';
import type { FarmCase } from './caseRepository';

const caseRecord: FarmCase = {
  id: 'case-01',
  ownerId: 'private-firebase-uid',
  farmId: 'private-farm-id',
  animalId: 'cattle-07',
  animalName: 'Bontle',
  subjectType: 'animal',
  disease: 'Lumpy-looking skin lesions',
  severity: 'Moderate',
  district: 'Southern',
  location: 'Private farm GPS 24.8 25.9',
  notes: 'Farmer personal phone +267 71 000 000',
  status: 'open',
  createdAt: '2026-10-16T09:00:00Z',
  updatedAt: '2026-10-16T09:00:00Z',
  verificationStatus: 'farmer_reported',
};

describe('private regional observation draft', () => {
  it('prepares a minimal unverified draft without identity, photos, farm ID or GPS', () => {
    const draft = prepareRegionalObservationDraft(
      caseRecord,
      '2026-10-17T12:00:00Z',
    );
    expect(draft).toEqual({
      status: 'draft_not_shared',
      preparedAt: '2026-10-17T12:00:00Z',
      district: 'Southern',
      subjectType: 'animal',
      suspectedCondition: 'Lumpy-looking skin lesions',
      caseStatus: 'open',
      verification: 'unverified_farmer_observation',
    });
    const serialized = JSON.stringify(draft);
    expect(serialized).not.toContain('private-firebase-uid');
    expect(serialized).not.toContain('private-farm-id');
    expect(serialized).not.toContain('Bontle');
    expect(serialized).not.toContain('+267');
    expect(serialized).not.toContain('25.9');
  });

  it('does not produce a district-level draft when the district is unknown', () => {
    expect(() => prepareRegionalObservationDraft({
      ...caseRecord, district: '',
    })).toThrow('Add your Botswana district');
  });

  it('marks even an observed serious disease as unverified', () => {
    const draft = prepareRegionalObservationDraft({
      ...caseRecord, disease: 'Foot and Mouth Disease',
    });
    expect(draft.verification).toBe('unverified_farmer_observation');
    expect(draft.status).toBe('draft_not_shared');
  });
});
