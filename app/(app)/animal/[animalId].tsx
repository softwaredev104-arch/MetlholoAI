import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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
} from '@/services/farms/domainRepository';
import {
  IconLabel,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function AnimalDetail() {
  const { animalId } = useLocalSearchParams<{ animalId: string }>();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [animal, setAnimal] = useState<AnimalRecord | null>(null);

  useEffect(() => {
    if (!user || !farm || !animalId) return;
    farmDomain.animals.list(user.uid, farm.id).then(items => {
      setAnimal(items.find(item => item.id === animalId) ?? null);
    });
  }, [user?.uid, farm?.id, animalId]);

  if (!animal) {
    return (
      <AppScreen>
        <AppText variant="largeTitle">Animal</AppText>
        <AppText>Loading animal record…</AppText>
      </AppScreen>
    );
  }

  return (
    <AppScreen maxWidth={900}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: colors.primarySubtle }]}>
          <Ionicons name="paw" size={40} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="largeTitle">{animal.name}</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            {[animal.species, animal.breed].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <StatusPill
          label={animal.healthStatus || 'Healthy'}
          tone={(animal.healthStatus || '').toLowerCase() === 'healthy' ? 'success' : 'warning'}
        />
      </View>

      <AppCard>
        <AppText variant="title2">Animal Information</AppText>
        <View style={styles.infoGrid}>
          <IconLabel icon="qr-code-outline" label="Tag ID" value={animal.tag || 'Not set'} />
          <IconLabel icon="calendar-outline" label="Age" value={animal.age || 'Not set'} />
          <IconLabel
            icon="scale-outline"
            label="Weight"
            value={animal.weightKg ? String(animal.weightKg) + ' kg' : 'Not set'}
          />
          <IconLabel icon="male-female-outline" label="Gender" value={animal.sex || 'Not set'} />
          <IconLabel icon="briefcase-outline" label="Purpose" value={animal.purpose || 'Not set'} />
          <IconLabel icon="medkit-outline" label="Last checkup" value={animal.lastCheckup || 'Not set'} />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="title2">Vaccinations</AppText>
        <View style={styles.pills}>
          {animal.vaccinations && animal.vaccinations.length > 0 ? (
            animal.vaccinations.map(item => (
              <StatusPill key={item} label={item} tone="info" />
            ))
          ) : (
            <AppText style={{ color: colors.textSecondary }}>
              No vaccinations recorded yet.
            </AppText>
          )}
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="title2">Notes</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          {animal.notes || 'No animal notes have been added.'}
        </AppText>
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          title="Edit Animal"
          variant="secondary"
          icon="create-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/animal/[animalId]/edit' as any,
              params: { animalId: animal.id },
            })
          }
        />
        <AppButton
          title="Create Case Record"
          icon="document-text-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/case/new' as any,
              params: { animalId: animal.id, animalName: animal.name },
            })
          }
        />
        <AppButton
          title="Add Health Record"
          variant="secondary"
          icon="medkit-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/health-record/new' as any,
              params: { relatedId: animal.id, relatedName: animal.name },
            })
          }
        />
        <AppButton
          title="Create Feeding Plan"
          variant="secondary"
          icon="nutrition-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/feeding-plan/new' as any,
              params: { animalId: animal.id, animalName: animal.name, species: animal.species || '' },
            })
          }
        />
        <AppButton
          title="Scan Animal"
          variant="ghost"
          icon="scan-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/scan' as any,
              params: { sourceRecordType: 'animals', sourceRecordId: animal.id, sourceName: animal.name },
            })
          }
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actions: { gap: Spacing.sm },
});
