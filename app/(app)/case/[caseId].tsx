import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
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
import { Spacing } from '@/design/spacing';

export default function CaseDetail() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [record, setRecord] = useState<FarmCase | null>(null);
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);

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
          {record.location ? <StatusPill label={record.location} /> : null}
          {record.district ? <StatusPill label={record.district} /> : null}
          {record.village ? <StatusPill label={record.village} /> : null}
        </View>
        <AppText style={{ color: colors.textSecondary }}>
          {record.notes || 'No case notes.'}
        </AppText>
        {record.photos && record.photos.length > 0 ? (
          <View style={styles.photos}>
            {record.photos.map(uri => (
              <Image key={uri} source={{ uri }} style={styles.photo} />
            ))}
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
