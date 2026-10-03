import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { ChoiceChip } from '@/components/app/ProductUI';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type AnimalRecord,
} from '@/services/farms/domainRepository';
import { Spacing } from '@/design/spacing';

const frequencies = ['Ad libitum', '1x daily', '2x daily', '3x daily'];

export default function NewFeedingPlan() {
  const params = useLocalSearchParams<{
    animalId?: string;
    animalName?: string;
    species?: string;
  }>();
  const { user, farm } = usePrimaryFarm();
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [animalId, setAnimalId] = useState(params.animalId ?? '');
  const [animalName, setAnimalName] = useState(params.animalName ?? '');
  const [species, setSpecies] = useState(params.species ?? '');
  const [feedType, setFeedType] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('2x daily');
  const [supplement, setSupplement] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !farm) return;
    farmDomain.animals.list(user.uid, farm.id).then(setAnimals);
  }, [user?.uid, farm?.id]);

  async function save() {
    if (!user || !farm || !animalName || !feedType.trim()) return;
    setLoading(true);
    try {
      await farmDomain.feeding.create(user.uid, farm.id, {
        name: animalName + ' feeding plan',
        animalId,
        animalName,
        species,
        feedType: feedType.trim(),
        amount: amount.trim(),
        frequency,
        supplement: supplement.trim(),
        costPerDay: cost.trim() ? Number(cost) : undefined,
        notes: notes.trim(),
        status: 'active',
      });
      router.replace('/(app)/feeding-plans' as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={760}>
      <AppText variant="largeTitle">New Feeding Plan</AppText>

      <View style={styles.section}>
        <AppText variant="headline">Animal</AppText>
        <View style={styles.chips}>
          {animals.map(animal => (
            <ChoiceChip
              key={animal.id}
              label={animal.name + (animal.species ? ' (' + animal.species + ')' : '')}
              selected={animalId === animal.id}
              onPress={() => {
                setAnimalId(animal.id);
                setAnimalName(animal.name);
                setSpecies(animal.species || '');
              }}
            />
          ))}
        </View>
      </View>

      <AppTextField label="Feed type / brand" value={feedType} onChangeText={setFeedType} placeholder="e.g. Lucerne + Dairy Concentrate" />
      <AppTextField label="Amount" value={amount} onChangeText={setAmount} placeholder="e.g. 12 kg/day" />

      <View style={styles.section}>
        <AppText variant="headline">Frequency</AppText>
        <View style={styles.chips}>
          {frequencies.map(item => (
            <ChoiceChip key={item} label={item} selected={frequency === item} onPress={() => setFrequency(item)} />
          ))}
        </View>
      </View>

      <AppTextField label="Supplement" value={supplement} onChangeText={setSupplement} placeholder="e.g. Vitamin ADE" />
      <AppTextField label="Daily cost (BWP)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="45" />
      <AppTextField label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={4} placeholder="Feeding notes..." />
      <AppButton title="Save Plan" icon="checkmark" onPress={save} loading={loading} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
