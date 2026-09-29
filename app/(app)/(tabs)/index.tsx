import { router } from 'expo-router';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const shortcuts = [
  ['Scan crop or animal', '/scan', 'scan-outline'],
  ['Explore models', '/intelligence', 'sparkles-outline'],
  ['Manage farm', '/(app)/(tabs)/farms', 'leaf-outline'],
  ['View dashboard', '/(app)/(tabs)/dashboard', 'analytics-outline'],
] as const;

export default function Home() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const firstName = profile?.displayName?.split(' ')[0] ?? 'farmer';

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="person" size={25} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="largeTitle">Hi, {firstName}</AppText>
          <AppText style={{ color: colors.textSecondary }}>Botswana · Weather and farm location</AppText>
        </View>
      </View>

      <AppCard>
        <AppText variant="headline">Today on your farm</AppText>
        <AppText style={{ color: colors.textSecondary }}>Weather, location and alerts will be personalized from your selected farm.</AppText>
      </AppCard>

      <AppText variant="headline">Shortcuts</AppText>
      <View style={styles.grid}>
        {shortcuts.map(([title, target, icon]) => (
          <Pressable key={title} accessibilityRole="button" onPress={() => router.push(target as any)} style={({ pressed }) => ({ width: '47%', opacity: pressed ? 0.75 : 1 })}>
            <AppCard style={styles.shortcut}>
              <Ionicons name={icon as any} size={28} color={colors.primary} />
              <AppText variant="headline">{title}</AppText>
            </AppCard>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  shortcut: { minHeight: 125, gap: Spacing.sm },
});