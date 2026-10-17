import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { DrivePhotoThumbnail, RecordPhotoField } from '@/components/farm/RecordPhotoField';
import { SectionHeader, StatusPill } from '@/components/app/ProductUI';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  listCases,
  updateCase,
  type FarmCase,
} from '@/services/cases/caseRepository';
import {
  listTreatments,
  type TreatmentRecord,
} from '@/services/treatments/treatmentRepository';
import { useTheme } from '@/design/themes';
import { prepareRegionalObservationDraft } from '@/services/cases/regionalObservation';
import { prepareProfessionalReviewDraft } from '@/services/cases/professionalReview';
import { Spacing } from '@/design/spacing';

export default function CaseDetail() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [record, setRecord] = useState<FarmCase | null>(null);
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  const [confirmRegional, setConfirmRegional] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');

  async function load() {
    if (!user || !farm || !caseId) return;
    const [cases, allTreatments] = await Promise.all([
      listCases(user.uid, farm.id),
      listTreatments(user.uid, farm.id),
    ]);
    setRecord(cases.find(item => item.id === caseId) ?? null);
    setTreatments(allTreatments.filter(item => item.caseId === caseId));
  }

  useEffect(() => {
    void load();
  }, [user?.uid, farm?.id, caseId]);

  async function resolve() {
    if (!user || !farm || !record) return;
    await updateCase(user.uid, farm.id, record.id, { status: 'resolved' });
    await load();
  }

  async function prepareDraft() {
    if (!user || !farm || !record) return;
    setDraftSaving(true);
    setDraftError('');
    try {
      const draft = prepareRegionalObservationDraft(record);
      const updated = await updateCase(user.uid, farm.id, record.id, {
        regionalContribution: draft,
      });
      if (!updated) throw new Error('Case not found in your farm records.');
      setConfirmRegional(false);
      await load();
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : 'Could not prepare the draft.');
    } finally {
      setDraftSaving(false);
    }
  }

  async function discardDraft() {
    if (!user || !farm || !record) return;
    setDraftSaving(true);
    setDraftError('');
    try {
      await updateCase(user.uid, farm.id, record.id, { regionalContribution: undefined });
      await load();
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : 'Unable to discard the draft.');
    } finally {
      setDraftSaving(false);
    }
  }

  async function prepareReview() {
    if (!user || !farm || !record) return;
    setReviewSaving(true);
    setReviewError('');
    try {
      const draft = prepareProfessionalReviewDraft(record);
      const updated = await updateCase(user.uid, farm.id, record.id, {
        professionalReview: draft,
      });
      if (!updated) throw new Error('Case not found in your farm records.');
      await load();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Could not prepare review draft.');
    } finally {
      setReviewSaving(false);
    }
  }

  async function discardReview() {
    if (!user || !farm || !record) return;
    setReviewSaving(true);
    setReviewError('');
    try {
      await updateCase(user.uid, farm.id, record.id, { professionalReview: undefined });
      await load();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Unable to discard review draft.');
    } finally {
      setReviewSaving(false);
    }
  }

  if (!record) {
    return (
      <AppScreen>
        <AppText variant="largeTitle">Case Record</AppText>
        <AppText>Loading case…</AppText>
      </AppScreen>
    );
  }

  const subjectName =
    record.subjectName ??
    record.animalName ??
    record.cropName ??
    'General farm health case';
  const subjectType =
    record.subjectType ??
    (record.animalId ? 'animal' : record.cropId ? 'crop' : 'general');

  return (
    <AppScreen maxWidth={900}>
      <SectionHeader
        title={record.disease}
        subtitle={subjectName}
        action={
          <StatusPill
            label={record.severity}
            tone={
              record.severity === 'Critical' || record.severity === 'Severe'
                ? 'error'
                : record.severity === 'Moderate'
                  ? 'warning'
                  : 'info'
            }
          />
        }
      />

      <AppCard>
        <View style={styles.meta}>
          <StatusPill
            label={record.status}
            tone={record.status === 'resolved' ? 'success' : 'info'}
          />
          <StatusPill
            label={
              subjectType === 'animal'
                ? 'Animal'
                : subjectType === 'crop'
                  ? 'Crop'
                  : 'General'
            }
          />
          {record.verificationStatus === 'farmer_reported' ? (
            <StatusPill label="Farmer observation · unverified" tone="warning" />
          ) : null}
          {record.regionalContribution ? (
            <StatusPill label="Regional research draft · not submitted" tone="info" />
          ) : null}
          {record.location ? <StatusPill label={record.location} /> : null}
          {record.district ? <StatusPill label={record.district} /> : null}
          {record.village ? <StatusPill label={record.village} /> : null}
        </View>
        {record.symptoms ? (
          <View>
            <AppText variant="headline">Observed symptoms</AppText>
            <AppText>{record.symptoms}</AppText>
          </View>
        ) : null}
        <AppText style={{ color: colors.textSecondary }}>
          {record.notes || 'No case notes.'}
        </AppText>
        {record.photos && record.photos.length > 0 ? (
          <View style={styles.photos}>
            {record.photos.map((photo, i) =>
              typeof photo === 'string' ? (
                <Image key={i} source={{ uri: photo }} style={styles.photo} />
              ) : (
                <DrivePhotoThumbnail
                  key={photo.id}
                  context={{ ownerId: user?.uid ?? '', farmId: farm?.id ?? '', recordType: 'cases' }}
                  photo={photo}
                  width={120}
                  height={120}
                />
              ),
            )}
          </View>
        ) : null}
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          title="Add Treatment"
          icon="medkit-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/treatment/new' as any,
              params: {
                caseId: record.id,
                subjectType,
                subjectId:
                  record.subjectId ??
                  record.animalId ??
                  record.cropId ??
                  '',
                subjectName,
                animalId: record.animalId || '',
                animalName: record.animalName || '',
                cropId: record.cropId || '',
                cropName: record.cropName || '',
              },
            })
          }
        />
        {record.status !== 'resolved' ? (
          <AppButton
            title="Mark Resolved"
            variant="secondary"
            icon="checkmark-circle-outline"
            onPress={resolve}
          />
        ) : null}
      </View>

      <SectionHeader title="Professional review" />
      <AppCard>
        <AppText variant="headline">Private review request draft</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          Prepare your symptoms and case details for a veterinarian or agricultural professional.
          This only saves a private draft to your existing case and Google Drive backup.
          No professional is contacted, and no diagnosis is confirmed.
        </AppText>
        {record.professionalReview ? (
          <>
            <StatusPill label="Draft prepared · not sent" tone="info" />
            <AppButton
              title="Discard review draft"
              variant="secondary"
              disabled={reviewSaving}
              onPress={discardReview}
            />
          </>
        ) : (
          <AppButton
            title="Prepare review request (not sent)"
            variant="secondary"
            icon="document-text-outline"
            loading={reviewSaving}
            onPress={prepareReview}
          />
        )}
        {reviewError ? <AppText style={{ color: colors.error }}>{reviewError}</AppText> : null}
      </AppCard>

      <SectionHeader title="Regional observation research" />
      <AppCard>
        <AppText variant="headline">Private draft — no external sharing</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          You can prepare a district-level research observation from this case.
          Only the district, broad subject type, suspected condition, case status
          and unverified classification are included. Your identity, precise
          location and photos are excluded. MetlholoAI does not currently send
          drafts to agricultural authorities, other farmers or public maps.
        </AppText>
        {record.regionalContribution ? (
          <>
            <StatusPill label="Draft prepared · not submitted" tone="info" />
            <AppButton
              title="Discard research draft"
              variant="secondary"
              disabled={draftSaving}
              onPress={discardDraft}
            />
          </>
        ) : confirmRegional ? (
          <>
            <AppText style={{ color: colors.textSecondary }}>
              This prepares a private draft within your Google Drive-backed
              farm case. It does not publish an alert or submit your data.
            </AppText>
            <AppButton title="Confirm private draft" loading={draftSaving} onPress={prepareDraft} />
            <AppButton title="Cancel" variant="ghost" onPress={() => setConfirmRegional(false)} />
          </>
        ) : (
          <AppButton
            title="Prepare private regional observation"
            variant="secondary"
            icon="document-text-outline"
            onPress={() => setConfirmRegional(true)}
          />
        )}
        {draftError ? <AppText style={{ color: colors.error }}>{draftError}</AppText> : null}
      </AppCard>

      <SectionHeader title="Treatments" />
      {treatments.length === 0 ? (
        <AppCard>
          <AppText style={{ color: colors.textSecondary }}>
            No treatment has been linked to this case yet.
          </AppText>
        </AppCard>
      ) : (
        treatments.map(item => (
          <AppCard key={item.id}>
            <View style={styles.top}>
              <View style={{ flex: 1 }}>
                <AppText variant="headline">{item.treatmentName}</AppText>
                <AppText style={{ color: colors.textSecondary }}>
                  {[item.dosage, item.frequency, item.method]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </View>
              <StatusPill
                label={item.status}
                tone={item.status === 'completed' ? 'success' : 'info'}
              />
            </View>
            {item.photos?.length ? (
              <RecordPhotoField
                context={{ ownerId: user?.uid ?? '', farmId: farm?.id ?? '', recordType: 'treatments' }}
                photos={item.photos}
                label="Treatment evidence"
              />
            ) : null}
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photo: { width: 120, height: 120, borderRadius: 16 },
  actions: { gap: Spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
