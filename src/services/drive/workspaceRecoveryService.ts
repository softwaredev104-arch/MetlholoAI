import type { UserProfile } from '@/types/user';
import { restoreUserProfileFromDrive } from '@/services/auth/userProfileService';
import { restoreFarmDataFromDrive, type Farm } from '@/services/farms/farmRepository';
import { restoreDiagnosesFromDrive } from '@/services/intelligence/diagnosisRepository';
import { restoreCasesFromDrive } from '@/services/cases/caseRepository';
import { restoreTreatmentsFromDrive } from '@/services/treatments/treatmentRepository';
import { restoreMarketplaceFromDrive } from '@/services/marketplace/marketplaceRepository';

export type WorkspaceRecoveryResult = {
  profile: UserProfile | null;
  farms: Farm[];
  restored: boolean;
};

export async function restoreWorkspaceFromDrive(
  ownerId: string,
): Promise<WorkspaceRecoveryResult> {
  const [profile, farms] = await Promise.all([
    restoreUserProfileFromDrive(ownerId),
    restoreFarmDataFromDrive(ownerId),
  ]);

  await Promise.all([
    restoreMarketplaceFromDrive(ownerId),
    ...farms.flatMap(farm => [
      restoreDiagnosesFromDrive(ownerId, farm.id),
      restoreCasesFromDrive(ownerId, farm.id),
      restoreTreatmentsFromDrive(ownerId, farm.id),
    ]),
  ]);

  return {
    profile,
    farms,
    restored: Boolean(profile || farms.length > 0),
  };
}
