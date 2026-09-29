import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';
import { getCurrentWeather, type WeatherSnapshot } from '@/services/weather/openMeteo';

const shortcuts = [
  ['Scan crop or animal', '/scan', 'scan-outline'],
  ['Explore models', '/intelligence', 'sparkles-outline'],
  ['Manage farm', '/(app)/(tabs)/farms', 'leaf-outline'],
  ['View dashboard', '/(app)/(tabs)/dashboard', 'analytics-outline'],
] as const;

function weatherLabel(code: number) {
  if (code === 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Current conditions';
}

export default function Home() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const firstName = profile?.displayName?.split(' ')[0] ?? 'farmer';

  useEffect(() => {
    getCurrentWeather().then(setWeather).catch(() => setWeather(null));
  }, []);

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="person" size={25} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="largeTitle">Hi, {firstName}</AppText>
          <AppText style={{ color: colors.textSecondary }}>Botswana · Farm intelligence</AppText>
        </View>
      </View>

      <AppCard>
        <View style={styles.weatherHeader}>
          <View style={[styles.weatherIcon, { backgroundColor: colors.primarySubtle }]}>
            <Ionicons name="partly-sunny-outline" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="headline">Weather</AppText>
            <AppText style={{ color: colors.textSecondary }}>{weather ? weatherLabel(weather.weatherCode) : 'Loading current conditions…'}</AppText>
          </View>
          {weather ? <AppText variant="largeTitle">{Math.round(weather.temperature)}°</AppText> : null}
        </View>
        {weather ? (
          <View style={styles.weatherStats}>
            <AppText style={{ color: colors.textSecondary }}>Feels {Math.round(weather.apparentTemperature)}°</AppText>
            <AppText style={{ color: colors.textSecondary }}>Humidity {weather.humidity}%</AppText>
            <AppText style={{ color: colors.textSecondary }}>Wind {Math.round(weather.windSpeed)} km/h</AppText>
          </View>
        ) : null}
        <AppText style={styles.coordinates}>
          Coordinates: {weather ? `${weather.latitude.toFixed(4)}, ${weather.longitude.toFixed(4)}` : '—'}
        </AppText>
      </AppCard>

      <View style={styles.sectionHeader}>
        <AppText variant="headline">Shortcuts</AppText>
        <AppText style={{ color: colors.textSecondary }}>Your farm workspace</AppText>
      </View>
      <View style={styles.grid}>
        {shortcuts.map(([title, target, icon]) => (
          <View key={title} style={styles.shortcutWrap}>
            <AppCard onTouchEnd={() => router.push(target as never)} style={styles.shortcut}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={28} color={colors.primary} />
              <AppText variant="headline">{title}</AppText>
            </AppCard>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  weatherHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  weatherIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  weatherStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  coordinates: { marginTop: Spacing.sm, opacity: 0.55, fontSize: 12 },
  sectionHeader: { gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  shortcutWrap: { width: '47%' },
  shortcut: { minHeight: 125, gap: Spacing.sm },
});
