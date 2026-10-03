import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type CropFieldRecord,
} from '@/services/farms/domainRepository';
import {
  ChoiceChip,
  SectionHeader,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const filters = ['All Fields', 'Grains', 'Vegetables', 'Fruit'];

const grainCrops = new Set(['Maize', 'Sorghum', 'Millet', 'Wheat']);
const vegetableCrops = new Set(['Tomato', 'Potato', 'Beans', 'Spinach', 'Pepper', 'Cassava']);
const fruitCrops = new Set(['Grape']);

function cropGroup(crop?: string) {
  if (!crop) return 'Other';
  if (grainCrops.has(crop)) return 'Grains';
  if (vegetableCrops.has(crop)) return 'Vegetables';
  if (fruitCrops.has(crop)) return 'Fruit';
  return 'Other';
}

export default function Crops() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [records, setRecords] = useState<CropFieldRecord[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All Fields');

  useEffect(() => {
    if (!user || !farm) return;
    farmDomain.crops.list(user.uid, farm.id).then(setRecords);
  }, [user?.uid, farm?.id]);

  const totalArea = records.reduce(
    (sum, item) => sum + Number(item.areaHectares ?? 0),
    0,
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter(item => {
      const groupMatch = filter === 'All Fields' || cropGroup(item.cropType) === filter;
      const queryMatch =
        !normalized ||
        [item.name, item.cropType, item.variety, item.location]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(normalized));
      return groupMatch && queryMatch;
    });
  }, [records, query, filter]);

  return (
    <AppScreen>
      <SectionHeader
        title="My Crops"
        subtitle={String(records.length) + ' fields · ' + totalArea.toFixed(1) + ' ha total'}
        action={
          <AppButton
            title="Add Field"
            icon="add"
            onPress={() => router.push('/(app)/crop/new' as any)}
          />
        }
      />

      <AppTextField
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="Search by crop, field name, location..."
      />

      <View style={styles.filters}>
        {filters.map(item => (
          <ChoiceChip
            key={item}
            label={item}
            selected={filter === item}
            onPress={() => setFilter(item)}
          />
        ))}
      </View>

      {filtered.length === 0 ? (
        <AppCard>
          <Ionicons name="leaf-outline" size={30} color={colors.primary} />
          <AppText variant="headline">
            {records.length === 0 ? 'No crop fields yet' : 'No matching fields'}
          </AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Add fields to track varieties, area, growth stages, health, irrigation and inspections.
          </AppText>
        </AppCard>
      ) : (
        filtered.map(field => (
          <AppCard
            key={field.id}
            onPress={() =>
              router.push({
                pathname: '/(app)/crop/[cropId]' as any,
                params: { cropId: field.id },
              })
            }
          >
            <View style={styles.top}>
              <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
                <Ionicons name="leaf" size={25} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title3">{field.name}</AppText>
                <AppText style={{ color: colors.textSecondary }}>
                  {[field.cropType, field.variety].filter(Boolean).join(' · ')}
                </AppText>
              </View>
              <StatusPill label={field.growthStage || 'Not staged'} tone="info" />
            </View>

            <View style={styles.meta}>
              {field.healthStatus ? (
                <StatusPill
                  label={field.healthStatus}
                  tone={field.healthStatus === 'Poor' ? 'error' : field.healthStatus === 'Fair' ? 'warning' : 'success'}
                />
              ) : null}
              {field.location ? <StatusPill label={field.location} /> : null}
              {field.areaHectares ? <StatusPill label={String(field.areaHectares) + ' ha'} /> : null}
            </View>
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
