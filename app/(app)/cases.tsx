import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { ChoiceChip, SectionHeader, StatusPill } from '@/components/app/ProductUI';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { listCases, type FarmCase } from '@/services/cases/caseRepository';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const filters = ['All', 'Open', 'Monitoring', 'Resolved'] as const;

function toneFor(severity: FarmCase['severity']) {
  if (severity === 'Critical' || severity === 'Severe') return 'error' as const;
  if (severity === 'Moderate') return 'warning' as const;
  return 'info' as const;
}

export default function Cases() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [records, setRecords] = useState<FarmCase[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');

  useEffect(() => {
    if (!user || !farm) return;
    listCases(user.uid, farm.id).then(setRecords);
  }, [user?.uid, farm?.id]);

  const visible = useMemo(
    () =>
      records.filter(
        item =>
          filter === 'All' ||
          item.status.toLowerCase() === filter.toLowerCase(),
      ),
    [records, filter],
  );

  return (
    <AppScreen>
      <SectionHeader
        title="Case Records"
        subtitle={String(records.length) + ' farm health cases'}
        action={
          <AppButton
            title="New Case"
            icon="add"
            onPress={() => router.push('/(app)/case/new' as any)}
          />
        }
      />

      <View style={styles.filters}>
        {filters.map(item => (
          <ChoiceChip
            key={item}
            label={item}
            selected={filter === item}
            onPress={() => setFilter(item)}
          />
        ))}
      </View>

      {visible.length === 0 ? (
        <AppCard>
          <AppText variant="headline">No case records in this view</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Create a case when an animal or farm health issue needs investigation,
            monitoring, treatment or veterinary follow-up.
          </AppText>
        </AppCard>
      ) : (
        visible.map(item => (
          <AppCard
            key={item.id}
            onPress={() =>
              router.push({
                pathname: '/(app)/case/[caseId]' as any,
                params: { caseId: item.id },
              })
            }
          >
            <View style={styles.top}>
              <View style={{ flex: 1 }}>
                <AppText variant="title3">{item.disease}</AppText>
                <AppText style={{ color: colors.textSecondary }}>
                  {[
                    item.subjectName ?? item.animalName ?? item.cropName,
                    item.village || item.location,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Farm case'}
                </AppText>
              </View>
              <StatusPill label={item.severity} tone={toneFor(item.severity)} />
            </View>
            <View style={styles.meta}>
              <StatusPill
                label={item.status}
                tone={item.status === 'resolved' ? 'success' : 'info'}
              />
              {item.district ? <StatusPill label={item.district} /> : null}
              <StatusPill
                label={new Date(item.createdAt).toLocaleDateString()}
              />
            </View>
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
