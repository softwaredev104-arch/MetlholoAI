import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { StatusPill } from '@/components/app/ProductUI';
import { useAuth } from '@/auth/AuthProvider';
import { listFarms, type Farm } from '@/services/farms/farmRepository';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function MyFarmsSettings() {
  const { firebaseUser } = useAuth();
  const { colors } = useTheme();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      setFarms(await listFarms(firebaseUser.uid));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [firebaseUser?.uid]);

  return (
    <AppScreen maxWidth={820}>
      <View style={styles.heading}>
        <View style={{ flex: 1 }}>
          <AppText variant="largeTitle">My Farms</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            {loading
              ? 'Loading registered locations…'
              : String(farms.length) +
                (farms.length === 1
                  ? ' location registered'
                  : ' locations registered')}
          </AppText>
        </View>
        <AppButton
          title="Add Farm"
          icon="add"
          onPress={() => router.push('/(app)/settings/farm/new' as any)}
        />
      </View>

      {farms.length === 0 && !loading ? (
        <AppCard>
          <AppText variant="headline">No farm locations registered</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Add a farm to connect animals, crops, weather and operational records
            to a specific location.
          </AppText>
        </AppCard>
      ) : (
        farms.map((farm, index) => (
          <AppCard
            key={farm.id}
            onPress={() =>
              router.push({
                pathname: '/(app)/settings/farm/[farmId]' as any,
                params: { farmId: farm.id },
              })
            }
          >
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
                <Ionicons name="leaf-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title3">{farm.name}</AppText>
                <AppText style={{ color: colors.textSecondary }}>
                  {farm.location || 'Location not mapped'}
                </AppText>
              </View>
              {index === 0 ? <StatusPill label="Primary" tone="success" /> : null}
            </View>
            <View style={styles.meta}>
              {farm.farmType ? <StatusPill label={farm.farmType} /> : null}
              {farm.farmSizeBand ? (
                <StatusPill label={farm.farmSizeBand} tone="info" />
              ) : null}
              {farm.latitude !== undefined && farm.longitude !== undefined ? (
                <StatusPill label="Weather mapped" tone="success" />
              ) : null}
            </View>
          </AppCard>
        ))
      )}

      <AppButton title="Back to Profile" variant="ghost" onPress={() => router.back()} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
