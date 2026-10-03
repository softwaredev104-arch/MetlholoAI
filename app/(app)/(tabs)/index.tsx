import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { useAuth } from '@/auth/AuthProvider';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';
import {
  getCurrentWeather,
  type CurrentWeather,
} from '@/services/weather/weatherService';
import {
  MetricCard,
  ResponsiveGrid,
  SectionHeader,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const modules = [
  ['Crop Disease', 'leaf-outline', '/(app)/(tabs)/scan', 'Scan leaves and crop symptoms'],
  ['Pest Detection', 'bug-outline', '/(app)/(tabs)/scan', 'Inspect insects and infestations'],
  ['Livestock', 'paw-outline', '/(app)/(tabs)/animals', 'Animals, health and diagnosis'],
  ['Treatment Guide', 'medkit-outline', '/(app)/health-records', 'Health records and follow-up'],
  ['Farm Records', 'file-tray-full-outline', '/(app)/(tabs)/farms', 'Crops, tasks and feeding'],
  ['Market Prices', 'trending-up-outline', '/(app)/market-prices', 'Reference price dashboard'],
  ['Reports', 'bar-chart-outline', '/(app)/reports', 'Farm and diagnosis analytics'],
] as const;

export default function Home() {
  const { profile } = useAuth();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [counts, setCounts] = useState({
    animals: 0,
    crops: 0,
    tasks: 0,
    health: 0,
  });

  const firstName = profile?.displayName?.split(' ')[0] ?? 'farmer';

  useEffect(() => {
    if (!user || !farm) return;

    Promise.all([
      farmDomain.animals.list(user.uid, farm.id),
      farmDomain.crops.list(user.uid, farm.id),
      farmDomain.tasks.list(user.uid, farm.id),
      farmDomain.health.list(user.uid, farm.id),
    ]).then(([animals, crops, tasks, health]) => {
      setCounts({
        animals: animals.length,
        crops: crops.length,
        tasks: tasks.filter(item => item.status !== 'done').length,
        health: health.filter(item => item.status !== 'completed').length,
      });
    });
  }, [user?.uid, farm?.id]);

  useEffect(() => {
    if (farm?.latitude === undefined || farm?.longitude === undefined) {
      setWeather(null);
      return;
    }

    getCurrentWeather(farm.latitude, farm.longitude)
      .then(setWeather)
      .catch(() => setWeather(null));
  }, [farm?.latitude, farm?.longitude]);

  const location = farm?.location ?? profile?.locationLabel ?? 'Botswana';

  const weatherSummary = useMemo(() => {
    if (!weather) return 'Select a mapped farm location to load current weather.';
    return weather.label + ' · ' + Math.round(weather.temperature) + '°C';
  }, [weather]);

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}>
          <Ionicons name="person" size={25} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="largeTitle">Hello, {firstName}</AppText>
          <AppText style={{ color: colors.textSecondary }}>{location}</AppText>
        </View>
        <Ionicons
          name="notifications-outline"
          size={25}
          color={colors.textPrimary}
          onPress={() => router.push('/(app)/(tabs)/alerts' as any)}
        />
      </View>

      <AppCard style={styles.weatherCard}>
        <View style={styles.weatherTop}>
          <View style={{ flex: 1, gap: 5 }}>
            <StatusPill label="Today on your farm" tone="info" />
            <AppText variant="title2">{weatherSummary}</AppText>
            <AppText style={{ color: colors.textSecondary }}>
              {weather
                ? 'Current conditions from your saved farm coordinates.'
                : 'Weather will activate when your farm has latitude and longitude.'}
            </AppText>
          </View>
          <Ionicons
            name={weather?.weatherCode === 0 ? 'sunny-outline' : 'partly-sunny-outline'}
            size={46}
            color={colors.weather}
          />
        </View>

        {weather ? (
          <ResponsiveGrid minCardWidth={120}>
            <MetricCard
              label="Humidity"
              value={Math.round(weather.humidity) + '%'}
              icon="water-outline"
              tone="primary"
            />
            <MetricCard
              label="Wind"
              value={Math.round(weather.windSpeed) + ' km/h'}
              icon="speedometer-outline"
              tone="accent"
            />
            <MetricCard
              label="Rain chance"
              value={Math.round(weather.precipitationProbability ?? 0) + '%'}
              icon="rainy-outline"
              tone="warning"
            />
          </ResponsiveGrid>
        ) : null}
      </AppCard>

      <ResponsiveGrid>
        <MetricCard label="Animals" value={counts.animals} icon="paw-outline" />
        <MetricCard label="Fields" value={counts.crops} icon="leaf-outline" tone="success" />
        <MetricCard label="Pending tasks" value={counts.tasks} icon="checkbox-outline" tone="accent" />
        <MetricCard label="Health follow-ups" value={counts.health} icon="medkit-outline" tone="warning" />
      </ResponsiveGrid>

      <SectionHeader
        title="Disease Detection"
        subtitle="Choose a workflow and move directly into the relevant farm tool."
      />

      <ResponsiveGrid minCardWidth={240}>
        {modules.map(([title, icon, target, subtitle]) => (
          <AppCard
            key={title}
            onPress={() => router.push(target as any)}
            style={styles.module}
          >
            <View style={[styles.moduleIcon, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name={icon as any} size={26} color={colors.primary} />
            </View>
            <AppText variant="headline">{title}</AppText>
            <AppText variant="footnote" style={{ color: colors.textSecondary }}>
              {subtitle}
            </AppText>
          </AppCard>
        ))}
      </ResponsiveGrid>

      <SectionHeader
        title="Recent alerts"
        subtitle="Health, weather and task signals from your farm."
        action={
          <AppText
            variant="callout"
            style={{ color: colors.primary }}
            onPress={() => router.push('/(app)/(tabs)/alerts' as any)}
          >
            View all
          </AppText>
        }
      />

      <AppCard>
        <AppText variant="headline">
          {counts.tasks + counts.health > 0 ? 'Farm actions need attention' : 'No active farm alerts'}
        </AppText>
        <AppText style={{ color: colors.textSecondary }}>
          {counts.tasks + counts.health > 0
            ? String(counts.tasks) +
              ' pending tasks and ' +
              String(counts.health) +
              ' health follow-ups are open.'
            : 'New weather, health and task alerts will appear here as your records change.'}
        </AppText>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherCard: { gap: Spacing.lg },
  weatherTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  module: { minHeight: 148 },
  moduleIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
