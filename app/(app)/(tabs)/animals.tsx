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
  type AnimalRecord,
} from '@/services/farms/domainRepository';
import {
  ChoiceChip,
  SectionHeader,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const filters = ['All', 'Cattle', 'Goat', 'Sheep', 'Chicken', 'Pigs'];

function statusTone(status?: string) {
  const value = (status ?? '').toLowerCase();
  if (value.includes('recover') || value.includes('care')) return 'warning' as const;
  if (value.includes('sick') || value.includes('quarantine')) return 'error' as const;
  return 'success' as const;
}

export default function Animals() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [records, setRecords] = useState<AnimalRecord[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  async function load() {
    if (!user || !farm) return;
    setRecords(await farmDomain.animals.list(user.uid, farm.id));
  }

  useEffect(() => {
    void load();
  }, [user?.uid, farm?.id]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter(item => {
      const filterMatch =
        filter === 'All' ||
        (item.species ?? '').toLowerCase() === filter.toLowerCase();

      const queryMatch =
        !normalized ||
        [item.name, item.tag, item.breed, item.species]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(normalized));

      return filterMatch && queryMatch;
    });
  }, [records, query, filter]);

  const speciesCounts = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach(item => {
      const key = item.species || 'Other';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries()).slice(0, 4);
  }, [records]);

  return (
    <AppScreen>
      <SectionHeader
        title="My Animals"
        subtitle={String(records.length) + ' animals registered'}
        action={
          <AppButton
            title="Add"
            icon="add"
            onPress={() => router.push('/(app)/animal/new' as any)}
          />
        }
      />

      {speciesCounts.length > 0 ? (
        <View style={styles.summary}>
          {speciesCounts.map(([species, count]) => (
            <StatusPill key={species} label={String(count) + ' ' + species} />
          ))}
        </View>
      ) : null}

      <AppTextField
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, tag, or breed..."
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
          <Ionicons name="paw-outline" size={30} color={colors.primary} />
          <AppText variant="headline">
            {records.length === 0 ? 'No animals registered yet' : 'No matching animals'}
          </AppText>
          <AppText style={{ color: colors.textSecondary }}>
            {records.length === 0
              ? 'Add cattle, goats, sheep, poultry or other livestock to start health and feeding records.'
              : 'Change the search or category filter.'}
          </AppText>
        </AppCard>
      ) : (
        filtered.map(animal => (
          <AppCard
            key={animal.id}
            onPress={() =>
              router.push({
                pathname: '/(app)/animal/[animalId]' as any,
                params: { animalId: animal.id },
              })
            }
          >
            <View style={styles.animalTop}>
              <View style={[styles.animalIcon, { backgroundColor: colors.primarySubtle }]}>
                <Ionicons name="paw" size={25} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title3">{animal.name}</AppText>
                <AppText variant="subheadline" style={{ color: colors.textSecondary }}>
                  {[animal.species, animal.breed].filter(Boolean).join(' · ') || 'Livestock'}
                </AppText>
              </View>
              <StatusPill
                label={animal.healthStatus || 'Healthy'}
                tone={statusTone(animal.healthStatus)}
              />
            </View>

            <View style={styles.meta}>
              {animal.tag ? <StatusPill label={animal.tag} /> : null}
              {animal.weightKg ? <StatusPill label={String(animal.weightKg) + ' kg'} /> : null}
              {animal.sex ? <StatusPill label={animal.sex} /> : null}
            </View>
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  animalTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  animalIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
