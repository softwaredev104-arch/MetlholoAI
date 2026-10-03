import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';
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
  ['Farm Tasks', 'checkbox-outline', '/(app)/tasks', 'tasks'],
  ['Feeding Plans', 'nutrition-outline', '/(app)/feeding-plans', 'feeding'],
  ['Market Prices', 'trending-up-outline', '/(app)/market-prices', 'market'],
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
  });

  useEffect(() => {
    if (!user || !farm) return;
    Promise.all([
      farmDomain.animals.list(user.uid, farm.id),
      farmDomain.crops.list(user.uid, farm.id),
      farmDomain.health.list(user.uid, farm.id),
      farmDomain.tasks.list(user.uid, farm.id),
      farmDomain.feeding.list(user.uid, farm.id),
    ]).then(([animals, crops, health, tasks, feeding]) => {
      setCounts({
        animals: animals.length,
        crops: crops.length,
        health: health.filter(item => item.status !== 'completed').length,
        tasks: tasks.filter(item => item.status !== 'done').length,
        feeding: feeding.filter(item => item.status !== 'archived').length,
      });
    });
  }, [user?.uid, farm?.id]);

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
        <MetricCard label="Fields" value={counts.crops} icon="leaf-outline" tone="success" />
        <MetricCard label="Tasks" value={counts.tasks} icon="checkbox-outline" tone="accent" />
        <MetricCard label="Health" value={counts.health} icon="medkit-outline" tone="warning" />
      </ResponsiveGrid>

      <SectionHeader
        title="Farm workspace"
        subtitle="Your operational modules use the same owner-scoped farm record."
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
                  : key === 'tasks'
                    ? counts.tasks
                    : key === 'feeding'
                      ? counts.feeding
                      : null;

          return (
            <AppCard key={title} onPress={() => router.push(target as any)}>
              <View style={styles.moduleRow}>
                <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
                  <Ionicons name={icon as any} size={23} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="headline">{title}</AppText>
                  <AppText variant="footnote" style={{ color: colors.textSecondary }}>
                    {count === null
                      ? 'Open reference prices'
                      : String(count) + (key === 'tasks' || key === 'health' ? ' open' : ' recorded')}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </AppCard>
          );
        })}
      </ResponsiveGrid>

      <SectionHeader title="Farm profile" />
      <AppCard>
        <AppText variant="headline">{farm.name}</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          {farm.location ?? 'Location not set'}
        </AppText>
        <View style={styles.meta}>
          <StatusPill label={farm.farmType ?? 'Mixed'} />
          {farm.farmSizeBand ? <StatusPill label={farm.farmSizeBand} tone="info" /> : null}
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
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
