import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type AnimalRecord,
  type CropFieldRecord,
  type FarmTask,
} from '@/services/farms/domainRepository';
import { listCases, type FarmCase } from '@/services/cases/caseRepository';
import {
  MetricCard,
  ResponsiveGrid,
  SectionHeader,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const modules = [
  ['All Animals', 'paw-outline', '/(app)/(tabs)/animals', 'animals'],
  ['All Crops', 'leaf-outline', '/(app)/crops', 'crops'],
  ['Health Records', 'medkit-outline', '/(app)/health-records', 'health'],
  ['Case Records', 'document-text-outline', '/(app)/cases', 'cases'],
  ['Farm Tasks', 'checkbox-outline', '/(app)/tasks', 'tasks'],
  ['Feeding Plans', 'nutrition-outline', '/(app)/feeding-plans', 'feeding'],
  ['Market Prices', 'trending-up-outline', '/(app)/market-prices', 'market'],
  ['Reports', 'bar-chart-outline', '/(app)/reports', 'reports'],
] as const;

export default function Farms() {
  const { user, farm, loading } = usePrimaryFarm();
  const { colors } = useTheme();
  const [counts, setCounts] = useState({
    animals: 0,
    crops: 0,
    health: 0,
    tasks: 0,
    feeding: 0,
    cases: 0,
  });
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [crops, setCrops] = useState<CropFieldRecord[]>([]);
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [cases, setCases] = useState<FarmCase[]>([]);

  useEffect(() => {
    if (!user || !farm) return;
    Promise.all([
      farmDomain.animals.list(user.uid, farm.id),
      farmDomain.crops.list(user.uid, farm.id),
      farmDomain.health.list(user.uid, farm.id),
      farmDomain.tasks.list(user.uid, farm.id),
      farmDomain.feeding.list(user.uid, farm.id),
      listCases(user.uid, farm.id),
    ]).then(([nextAnimals, nextCrops, health, nextTasks, feeding, nextCases]) => {
      setAnimals(nextAnimals);
      setCrops(nextCrops);
      setTasks(nextTasks);
      setCases(nextCases);
      setCounts({
        animals: nextAnimals.length,
        crops: nextCrops.length,
        health: health.filter(item => item.status !== 'completed').length,
        tasks: nextTasks.filter(item => item.status !== 'done').length,
        feeding: feeding.filter(item => item.status !== 'archived').length,
        cases: nextCases.filter(item => item.status !== 'resolved').length,
      });
    });
  }, [user?.uid, farm?.id]);

  const animalHealth = useMemo(() => {
    const healthy = animals.filter(
      item => (item.healthStatus ?? 'Healthy').toLowerCase() === 'healthy',
    ).length;
    return {
      healthy,
      needsCare: Math.max(0, animals.length - healthy),
    };
  }, [animals]);

  const cropHealth = useMemo(() => {
    const good = crops.filter(item =>
      ['excellent', 'good'].includes((item.healthStatus ?? 'good').toLowerCase()),
    ).length;
    return {
      good,
      needsCare: Math.max(0, crops.length - good),
    };
  }, [crops]);

  const priorityTasks = useMemo(
    () =>
      tasks
        .filter(item => item.status !== 'done')
        .sort((a, b) => {
          const rank = (value?: string) =>
            value === 'High' ? 0 : value === 'Medium' ? 1 : 2;
          return rank(a.priority) - rank(b.priority);
        })
        .slice(0, 3),
    [tasks],
  );

  const openCases = useMemo(
    () => cases.filter(item => item.status !== 'resolved').slice(0, 3),
    [cases],
  );

  if (loading) {
    return (
      <AppScreen>
        <AppText variant="largeTitle">Farm Dashboard</AppText>
        <AppText>Loading your farm workspace…</AppText>
      </AppScreen>
    );
  }

  if (!farm) {
    return (
      <AppScreen maxWidth={720}>
        <AppText variant="largeTitle">Farm Dashboard</AppText>
        <AppCard>
          <AppText variant="headline">No farm is configured yet</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Complete farm setup before adding animals, crops and farm records.
          </AppText>
          <AppButton
            title="Open farm setup"
            onPress={() => router.push('/(onboarding)/farm-setup' as any)}
          />
        </AppCard>
      </AppScreen>
    );
  }

  const alertCount = counts.health + counts.cases;

  return (
    <AppScreen>
      <View style={styles.heading}>
        <View style={{ flex: 1 }}>
          <AppText variant="largeTitle">Farm Dashboard</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            {farm.name} · {farm.location ?? 'Location not set'}
          </AppText>
        </View>
        <StatusPill label={farm.farmType ?? 'MIXED'} tone="success" />
      </View>

      <ResponsiveGrid>
        <MetricCard label="Animals" value={counts.animals} icon="paw-outline" />
        <MetricCard
          label="Fields"
          value={counts.crops}
          icon="leaf-outline"
          tone="success"
        />
        <MetricCard
          label="Tasks"
          value={counts.tasks}
          icon="checkbox-outline"
          tone="accent"
        />
        <MetricCard
          label="Alerts"
          value={alertCount}
          icon="alert-circle-outline"
          tone="warning"
        />
      </ResponsiveGrid>

      <SectionHeader
        title="Farm workspace"
        subtitle="Open the operational module you need."
      />

      <ResponsiveGrid minCardWidth={250}>
        {modules.map(([title, icon, target, key]) => {
          const count =
            key === 'animals'
              ? counts.animals
              : key === 'crops'
                ? counts.crops
                : key === 'health'
                  ? counts.health
                  : key === 'cases'
                    ? counts.cases
                    : key === 'tasks'
                      ? counts.tasks
                      : key === 'feeding'
                        ? counts.feeding
                        : null;

          return (
            <AppCard key={title} onPress={() => router.push(target as any)}>
              <View style={styles.moduleRow}>
                <View
                  style={[styles.icon, { backgroundColor: colors.primarySubtle }]}
                >
                  <Ionicons name={icon as any} size={23} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="headline">{title}</AppText>
                  <AppText
                    variant="footnote"
                    style={{ color: colors.textSecondary }}
                  >
                    {count === null
                      ? key === 'market'
                        ? 'Open reference prices'
                        : 'Open analytics'
                      : String(count) +
                        (key === 'tasks' ||
                        key === 'health' ||
                        key === 'cases'
                          ? ' open'
                          : ' recorded')}
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textTertiary}
                />
              </View>
            </AppCard>
          );
        })}
      </ResponsiveGrid>

      <SectionHeader title="Livestock Health" />
      <AppCard>
        <View style={styles.summaryRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="title3">{animalHealth.healthy}</AppText>
            <AppText style={{ color: colors.textSecondary }}>Healthy</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title3">{animalHealth.needsCare}</AppText>
            <AppText style={{ color: colors.textSecondary }}>Needs Care</AppText>
          </View>
        </View>
      </AppCard>

      <SectionHeader title="Field Health" />
      <AppCard>
        <View style={styles.summaryRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="title3">{cropHealth.good}</AppText>
            <AppText style={{ color: colors.textSecondary }}>Good / Excellent</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title3">{cropHealth.needsCare}</AppText>
            <AppText style={{ color: colors.textSecondary }}>Needs Attention</AppText>
          </View>
        </View>
      </AppCard>

      <SectionHeader
        title="Priority Tasks"
        action={
          <AppText
            variant="callout"
            style={{ color: colors.primary }}
            onPress={() => router.push('/(app)/tasks' as any)}
          >
            View all
          </AppText>
        }
      />
      {priorityTasks.length === 0 ? (
        <AppCard>
          <AppText style={{ color: colors.textSecondary }}>
            No pending tasks.
          </AppText>
        </AppCard>
      ) : (
        priorityTasks.map(task => (
          <AppCard key={task.id}>
            <View style={styles.summaryRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="headline">{task.name}</AppText>
                <AppText
                  variant="footnote"
                  style={{ color: colors.textSecondary }}
                >
                  {[task.relatedTo, task.dueDate].filter(Boolean).join(' · ')}
                </AppText>
              </View>
              {task.priority ? (
                <StatusPill
                  label={task.priority}
                  tone={
                    task.priority === 'High'
                      ? 'error'
                      : task.priority === 'Medium'
                        ? 'warning'
                        : 'neutral'
                  }
                />
              ) : null}
            </View>
          </AppCard>
        ))
      )}

      <SectionHeader
        title="Open Cases"
        action={
          <AppText
            variant="callout"
            style={{ color: colors.primary }}
            onPress={() => router.push('/(app)/cases' as any)}
          >
            View all
          </AppText>
        }
      />
      {openCases.length === 0 ? (
        <AppCard>
          <AppText style={{ color: colors.textSecondary }}>
            No open case records.
          </AppText>
        </AppCard>
      ) : (
        openCases.map(item => (
          <AppCard
            key={item.id}
            onPress={() =>
              router.push({
                pathname: '/(app)/case/[caseId]' as any,
                params: { caseId: item.id },
              })
            }
          >
            <View style={styles.summaryRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="headline">{item.disease}</AppText>
                <AppText
                  variant="footnote"
                  style={{ color: colors.textSecondary }}
                >
                  {item.subjectName ??
                    item.animalName ??
                    item.cropName ??
                    'General farm case'}
                </AppText>
              </View>
              <StatusPill
                label={item.severity}
                tone={
                  item.severity === 'Critical' || item.severity === 'Severe'
                    ? 'error'
                    : item.severity === 'Moderate'
                      ? 'warning'
                      : 'info'
                }
              />
            </View>
          </AppCard>
        ))
      )}

      <SectionHeader title="Farm profile" />
      <AppCard>
        <AppText variant="headline">{farm.name}</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          {farm.location ?? 'Location not set'}
        </AppText>
        <View style={styles.meta}>
          <StatusPill label={farm.farmType ?? 'Mixed'} />
          {farm.farmSizeBand ? (
            <StatusPill label={farm.farmSizeBand} tone="info" />
          ) : null}
          {farm.latitude !== undefined && farm.longitude !== undefined ? (
            <StatusPill label="Weather mapped" tone="success" />
          ) : (
            <StatusPill label="Location not mapped" tone="warning" />
          )}
        </View>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  moduleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
