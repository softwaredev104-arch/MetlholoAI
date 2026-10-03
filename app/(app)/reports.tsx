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
import { listCases, type FarmCase } from '@/services/cases/caseRepository';
import {
  ChoiceChip,
  MetricCard,
  ResponsiveGrid,
  SectionHeader,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

type ReportTab = 'Overview' | 'Crops' | 'Livestock' | 'Pests' | 'Cases';

const tabs: ReportTab[] = ['Overview', 'Crops', 'Livestock', 'Pests', 'Cases'];
const pestTerms = [
  'pest',
  'beetle',
  'armyworm',
  'grasshopper',
  'mite',
  'aphid',
  'worm',
  'insect',
];

function percentConfidence(value: number) {
  return Math.round(value <= 1 ? value * 100 : value);
}

function distributionFromDiagnoses(records: DiagnosisRecord[]) {
  const counts = new Map<string, number>();
  records.forEach(item => {
    const key = item.outcome || item.modelName || 'Unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
}

function distributionFromCases(records: FarmCase[]) {
  const counts = new Map<string, number>();
  records.forEach(item => {
    counts.set(item.disease, (counts.get(item.disease) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
}

function lastSixMonths(records: FarmCase[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const count = records.filter(item => {
      const created = new Date(item.createdAt);
      return created.getFullYear() === year && created.getMonth() === month;
    }).length;
    return {
      label: date.toLocaleDateString(undefined, { month: 'short' }),
      count,
    };
  });
}

export default function Reports() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<ReportTab>('Overview');
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [cases, setCases] = useState<FarmCase[]>([]);
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
      listCases(user.uid, farm.id),
      farmDomain.animals.list(user.uid, farm.id),
      farmDomain.crops.list(user.uid, farm.id),
      farmDomain.health.list(user.uid, farm.id),
      farmDomain.tasks.list(user.uid, farm.id),
    ]).then(([nextDiagnoses, nextCases, animals, crops, health, tasks]) => {
      setDiagnoses(nextDiagnoses);
      setCases(nextCases);
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

  const filteredDiagnoses = useMemo(() => {
    if (activeTab === 'Crops') {
      return diagnoses.filter(item => item.sourceRecordType === 'crops');
    }
    if (activeTab === 'Livestock') {
      return diagnoses.filter(item => item.sourceRecordType === 'animals');
    }
    if (activeTab === 'Pests') {
      return diagnoses.filter(item => {
        const text = [
          item.outcome,
          item.modelName,
          item.subject,
        ]
          .join(' ')
          .toLowerCase();
        return pestTerms.some(term => text.includes(term));
      });
    }
    return diagnoses;
  }, [activeTab, diagnoses]);

  const distribution = useMemo(
    () =>
      activeTab === 'Cases'
        ? distributionFromCases(cases)
        : distributionFromDiagnoses(filteredDiagnoses),
    [activeTab, cases, filteredDiagnoses],
  );

  const maxCount = Math.max(1, ...distribution.map(([, count]) => count));
  const monthlyCases = useMemo(() => lastSixMonths(cases), [cases]);
  const maxMonthly = Math.max(1, ...monthlyCases.map(item => item.count));

  return (
    <AppScreen>
      <SectionHeader
        title="Reports & Analytics"
        subtitle={farm ? farm.name : 'Farm overview'}
      />

      <View style={styles.tabs}>
        {tabs.map(tab => (
          <ChoiceChip
            key={tab}
            label={tab}
            selected={activeTab === tab}
            onPress={() => setActiveTab(tab)}
          />
        ))}
      </View>

      {activeTab === 'Overview' ? (
        <>
          <ResponsiveGrid>
            <MetricCard
              label="Diagnoses"
              value={diagnoses.length}
              icon="scan-outline"
            />
            <MetricCard
              label="Avg. confidence"
              value={
                diagnoses.length
                  ? percentConfidence(averageConfidence) + '%'
                  : '—'
              }
              icon="checkmark-circle-outline"
              tone="success"
            />
            <MetricCard
              label="Animals"
              value={counts.animals}
              icon="paw-outline"
            />
            <MetricCard
              label="Crop fields"
              value={counts.crops}
              icon="leaf-outline"
              tone="accent"
            />
          </ResponsiveGrid>

          <SectionHeader title="Farm record coverage" />
          <ResponsiveGrid minCardWidth={180}>
            <MetricCard
              label="Health records"
              value={counts.health}
              icon="medkit-outline"
              tone="warning"
            />
            <MetricCard
              label="Farm tasks"
              value={counts.tasks}
              icon="checkbox-outline"
            />
            <MetricCard
              label="Case records"
              value={cases.length}
              icon="document-text-outline"
              tone="accent"
            />
          </ResponsiveGrid>
        </>
      ) : null}

      {activeTab === 'Cases' ? (
        <>
          <SectionHeader
            title="Cases Over Time"
            subtitle="Last 6 months from saved case records."
          />
          <AppCard>
            <View style={styles.months}>
              {monthlyCases.map(item => (
                <View key={item.label} style={styles.monthColumn}>
                  <AppText variant="caption">{String(item.count)}</AppText>
                  <View style={[styles.monthTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <View
                      style={[
                        styles.monthBar,
                        {
                          backgroundColor: colors.primary,
                          height:
                            (String(
                              Math.max(8, Math.round((item.count / maxMonthly) * 100)),
                            ) + '%') as `${number}%`,
                        },
                      ]}
                    />
                  </View>
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>
                    {item.label}
                  </AppText>
                </View>
              ))}
            </View>
          </AppCard>
        </>
      ) : null}

      <SectionHeader
        title={
          activeTab === 'Overview'
            ? 'Top diagnosed issues'
            : activeTab === 'Cases'
              ? 'Case categories'
              : activeTab + ' findings'
        }
        subtitle={
          activeTab === 'Cases'
            ? 'Calculated from saved farm case records.'
            : 'Calculated from diagnoses saved on this farm.'
        }
      />

      {distribution.length === 0 ? (
        <AppCard>
          <AppText variant="headline">No data in this report view</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            {activeTab === 'Cases'
              ? 'Create case records to populate case analytics.'
              : 'Run AI scans and save diagnoses to populate this analytics view.'}
          </AppText>
        </AppCard>
      ) : (
        distribution.map(([name, count]) => (
          <AppCard key={name}>
            <View style={styles.row}>
              <AppText variant="headline" style={{ flex: 1 }}>
                {name}
              </AppText>
              <StatusPill label={String(count) + ' cases'} tone="info" />
            </View>
            <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: colors.primary,
                    width:
                      (String(Math.round((count / maxCount) * 100)) + '%') as `${number}%`,
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
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  track: { height: 9, borderRadius: 999, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 999 },
  months: {
    minHeight: 190,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  monthColumn: {
    flex: 1,
    minWidth: 44,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  monthTrack: {
    width: 30,
    height: 130,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  monthBar: {
    width: '100%',
    borderRadius: 999,
  },
});
