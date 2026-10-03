import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';
import { driveAuthService } from '@/services/drive/driveAuthService';
import {
  getCurrentWeather,
  type CurrentWeather,
} from '@/services/weather/weatherService';
import { ChoiceChip, SectionHeader, StatusPill } from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

type AlertCategory = 'Outbreaks' | 'Weather' | 'System';

type AlertItem = {
  id: string;
  category: AlertCategory;
  title: string;
  body: string;
  tone: 'info' | 'warning' | 'error' | 'success';
  icon: keyof typeof Ionicons.glyphMap;
};

export default function Alerts() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<'All' | AlertCategory>('All');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    if (!user || !farm) return;

    Promise.all([
      farmDomain.tasks.list(user.uid, farm.id),
      farmDomain.health.list(user.uid, farm.id),
    ]).then(([tasks, health]) => {
      const next: AlertItem[] = [];

      tasks
        .filter(item => item.status !== 'done' && item.priority === 'High')
        .forEach(item => {
          next.push({
            id: 'task-' + item.id,
            category: 'System',
            title: 'High priority farm task',
            body:
              item.name +
              (item.dueDate ? ' · due ' + item.dueDate : '') +
              (item.relatedTo ? ' · ' + item.relatedTo : ''),
            tone: 'warning',
            icon: 'checkbox-outline',
          });
        });

      health
        .filter(item => String(item.status).toLowerCase() === 'overdue')
        .forEach(item => {
          next.push({
            id: 'health-' + item.id,
            category: 'System',
            title: 'Health record overdue',
            body: item.description || item.name,
            tone: 'error',
            icon: 'medkit-outline',
          });
        });

      if (!driveAuthService.isConnected()) {
        next.push({
          id: 'drive-session',
          category: 'System',
          title: 'Google Drive session needs reconnecting',
          body: 'Local records continue to work. Reconnect Drive from Profile before you want to sync new changes.',
          tone: 'info',
          icon: 'cloud-outline',
        });
      }

      setAlerts(next);
    });
  }, [user?.uid, farm?.id]);

  useEffect(() => {
    if (farm?.latitude === undefined || farm?.longitude === undefined) return;
    getCurrentWeather(farm.latitude, farm.longitude)
      .then(next => {
        setWeather(next);
        if ((next.precipitationProbability ?? 0) >= 60) {
          setAlerts(current => [
            ...current.filter(item => item.id !== 'weather-rain'),
            {
              id: 'weather-rain',
              category: 'Weather',
              title: 'Rain probability is elevated',
              body:
                String(Math.round(next.precipitationProbability ?? 0)) +
                '% rain probability at your mapped farm location.',
              tone: 'warning',
              icon: 'rainy-outline',
            },
          ]);
        }
      })
      .catch(() => setWeather(null));
  }, [farm?.latitude, farm?.longitude]);

  const visible = useMemo(
    () => alerts.filter(item => filter === 'All' || item.category === filter),
    [alerts, filter],
  );

  return (
    <AppScreen>
      <SectionHeader
        title="Alerts & Notifications"
        subtitle="Farm actions, weather and future outbreak feeds"
      />

      <View style={styles.filters}>
        {(['All', 'Outbreaks', 'Weather', 'System'] as const).map(item => (
          <ChoiceChip
            key={item}
            label={item}
            selected={filter === item}
            onPress={() => setFilter(item)}
          />
        ))}
      </View>

      {(filter === 'All' || filter === 'Outbreaks') ? (
        <AppCard>
          <View style={styles.alertRow}>
            <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="headline">Outbreak feed not connected</AppText>
              <AppText style={{ color: colors.textSecondary }}>
                The screen and preference flow are implemented, but MetlholoAI will not invent live disease outbreaks. A verified veterinary/public-health source must be connected before outbreak notifications are shown.
              </AppText>
            </View>
          </View>
        </AppCard>
      ) : null}

      {(filter === 'All' || filter === 'Weather') && weather ? (
        <AppCard>
          <View style={styles.alertRow}>
            <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name="partly-sunny-outline" size={24} color={colors.weather} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="headline">Current farm weather</AppText>
              <AppText style={{ color: colors.textSecondary }}>
                {weather.label +
                  ' · ' +
                  Math.round(weather.temperature) +
                  '°C · ' +
                  Math.round(weather.humidity) +
                  '% humidity'}
              </AppText>
            </View>
          </View>
        </AppCard>
      ) : null}

      {visible.map(item => (
        <AppCard key={item.id}>
          <View style={styles.alertRow}>
            <View style={[styles.icon, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name={item.icon} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <View style={styles.titleRow}>
                <AppText variant="headline" style={{ flex: 1 }}>{item.title}</AppText>
                <StatusPill label={item.category} tone={item.tone} />
              </View>
              <AppText style={{ color: colors.textSecondary }}>{item.body}</AppText>
            </View>
          </View>
        </AppCard>
      ))}

      {visible.length === 0 && filter !== 'Outbreaks' ? (
        <AppCard>
          <AppText variant="headline">No active alerts in this category</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            New signals appear as weather, health and task state changes.
          </AppText>
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
