import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';
import { listCases } from '@/services/cases/caseRepository';
import { listDiagnoses } from '@/services/intelligence/diagnosisRepository';
import {
  MetricCard,
  ResponsiveGrid,
  SectionHeader,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function AdminConsole() {
  const { profile } = useAuth();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [metrics, setMetrics] = useState({
    cases: 0,
    diagnoses: 0,
    animals: 0,
    crops: 0,
    tasks: 0,
  });

  useEffect(() => {
    if (profile?.role !== 'ADMIN' || !user || !farm) return;

    Promise.all([
      listCases(user.uid, farm.id),
      listDiagnoses(user.uid, farm.id),
      farmDomain.animals.list(user.uid, farm.id),
      farmDomain.crops.list(user.uid, farm.id),
      farmDomain.tasks.list(user.uid, farm.id),
    ]).then(([cases, diagnoses, animals, crops, tasks]) => {
      setMetrics({
        cases: cases.length,
        diagnoses: diagnoses.length,
        animals: animals.length,
        crops: crops.length,
        tasks: tasks.filter(item => item.status !== 'done').length,
      });
    });
  }, [profile?.role, user?.uid, farm?.id]);

  if (profile?.role !== 'ADMIN') {
    return (
      <AppScreen maxWidth={720}>
        <AppText variant="largeTitle">Admin Console</AppText>
        <AppCard>
          <StatusPill label="Restricted" tone="warning" />
          <AppText variant="headline">Administrator access required</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            This workspace is available only to accounts explicitly assigned the
            ADMIN role.
          </AppText>
          <AppButton
            title="Return to Profile"
            variant="secondary"
            onPress={() => router.replace('/(app)/(tabs)/profile' as any)}
          />
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionHeader
        title="Admin Console"
        subtitle="Operational view for the authenticated MetlholoAI workspace"
      />

      <AppCard style={{ backgroundColor: colors.accentSubtle }}>
        <StatusPill label="Scope: current workspace" tone="info" />
        <AppText variant="headline">No central platform database is connected</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          These metrics are calculated from this administrator's locally owned
          farm data and saved Google Drive records. Global users, revenue,
          regional hotspots and cross-farm statistics require an organization
          backend or approved aggregate data source and are not fabricated here.
        </AppText>
      </AppCard>

      <ResponsiveGrid>
        <MetricCard label="Cases" value={metrics.cases} icon="medkit-outline" tone="warning" />
        <MetricCard label="AI diagnoses" value={metrics.diagnoses} icon="scan-outline" />
        <MetricCard label="Animals" value={metrics.animals} icon="paw-outline" />
        <MetricCard label="Crop fields" value={metrics.crops} icon="leaf-outline" tone="success" />
      </ResponsiveGrid>

      <SectionHeader title="Operational state" />
      <AppCard>
        <View style={styles.row}>
          <AppText variant="headline" style={{ flex: 1 }}>Pending farm tasks</AppText>
          <StatusPill
            label={String(metrics.tasks)}
            tone={metrics.tasks > 0 ? 'warning' : 'success'}
          />
        </View>
      </AppCard>

      <SectionHeader title="Future platform analytics" />
      {[
        ['Users & Roles', 'Requires central account/organization directory'],
        ['Regional Health Risk', 'Requires verified aggregate health data'],
        ['Revenue', 'Requires subscription/payment ledger'],
        ['Hotspot Map', 'Requires consented geospatial aggregation'],
      ].map(([title, subtitle]) => (
        <AppCard key={title}>
          <AppText variant="headline">{title}</AppText>
          <AppText style={{ color: colors.textSecondary }}>{subtitle}</AppText>
        </AppCard>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
