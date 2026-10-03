import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';
import {
  listDiagnoses,
  type DiagnosisRecord,
} from '@/services/intelligence/diagnosisRepository';
import {
  MetricCard,
  ResponsiveGrid,
  SectionHeader,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function Reports() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [counts, setCounts] = useState({
    animals: 0,
    crops: 0,
    health: 0,
    tasks: 0,
  });

  useEffect(() => {
    if (!user || !farm) return;
    Promise.all([
      listDiagnoses(user.uid, farm.id),
      farmDomain.animals.list(user.uid, farm.id),
      farmDomain.crops.list(user.uid, farm.id),
      farmDomain.health.list(user.uid, farm.id),
      farmDomain.tasks.list(user.uid, farm.id),
    ]).then(([nextDiagnoses, animals, crops, health, tasks]) => {
      setDiagnoses(nextDiagnoses);
      setCounts({
        animals: animals.length,
        crops: crops.length,
        health: health.length,
        tasks: tasks.length,
      });
    });
  }, [user?.uid, farm?.id]);

  const averageConfidence = useMemo(() => {
    if (!diagnoses.length) return 0;
    return (
      diagnoses.reduce((sum, item) => sum + Number(item.confidence || 0), 0) /
      diagnoses.length
    );
  }, [diagnoses]);

  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    diagnoses.forEach(item => {
      counts.set(item.outcome, (counts.get(item.outcome) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [diagnoses]);

  const maxCount = Math.max(1, ...distribution.map(([, count]) => count));

  return (
    <AppScreen>
      <SectionHeader
        title="Reports & Analytics"
        subtitle={farm ? farm.name : 'Farm overview'}
      />

      <ResponsiveGrid>
        <MetricCard label="Diagnoses" value={diagnoses.length} icon="scan-outline" />
        <MetricCard
          label="Avg. confidence"
          value={diagnoses.length ? Math.round(averageConfidence * (averageConfidence <= 1 ? 100 : 1)) + '%' : '—'}
          icon="checkmark-circle-outline"
          tone="success"
        />
        <MetricCard label="Animals" value={counts.animals} icon="paw-outline" />
        <MetricCard label="Crop fields" value={counts.crops} icon="leaf-outline" tone="accent" />
      </ResponsiveGrid>

      <SectionHeader title="Farm record coverage" />
      <ResponsiveGrid minCardWidth={180}>
        <MetricCard label="Health records" value={counts.health} icon="medkit-outline" tone="warning" />
        <MetricCard label="Farm tasks" value={counts.tasks} icon="checkbox-outline" />
      </ResponsiveGrid>

      <SectionHeader
        title="Top diagnosed issues"
        subtitle="Calculated from diagnoses saved on this farm."
      />

      {distribution.length === 0 ? (
        <AppCard>
          <AppText variant="headline">No saved diagnoses yet</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Run an AI scan and save a diagnosis to populate this report.
          </AppText>
        </AppCard>
      ) : (
        distribution.map(([name, count]) => (
          <AppCard key={name}>
            <View style={styles.row}>
              <AppText variant="headline" style={{ flex: 1 }}>{name}</AppText>
              <StatusPill label={String(count) + ' cases'} tone="info" />
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: colors.primary,
                    width: (String(Math.round((count / maxCount) * 100)) + '%') as `${number}%`,
                  },
                ]}
              />
            </View>
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  track: { height: 9, borderRadius: 999, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 999 },
});
