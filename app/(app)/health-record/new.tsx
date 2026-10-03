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
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const types = ['Vaccination', 'Treatment', 'Checkup', 'Surgery'];

export default function NewHealthRecord() {
  const params = useLocalSearchParams<{ relatedId?: string; relatedName?: string }>();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [relatedId, setRelatedId] = useState(params.relatedId ?? '');
  const [relatedName, setRelatedName] = useState(params.relatedName ?? '');
  const [recordType, setRecordType] = useState('Vaccination');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [officer, setOfficer] = useState('');
  const [cost, setCost] = useState('');
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !farm) return;
    farmDomain.animals.list(user.uid, farm.id).then(setAnimals);
  }, [user?.uid, farm?.id]);

  async function save() {
    if (!user || !farm || description.trim().length < 2) return;
    setLoading(true);
    try {
      await farmDomain.health.create(user.uid, farm.id, {
        name: description.trim(),
        description: description.trim(),
        recordType,
        relatedId,
        relatedName,
        date: date.trim(),
        dueDate: dueDate.trim(),
        officer: officer.trim(),
        cost: cost.trim() ? Number(cost) : undefined,
        status: completed ? 'completed' : 'scheduled',
      });
      router.replace('/(app)/health-records' as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={760}>
      <AppText variant="largeTitle">New Health Record</AppText>

      <View style={styles.section}>
        <AppText variant="headline">Animal</AppText>
        <View style={styles.chips}>
          {animals.map(animal => (
            <ChoiceChip
              key={animal.id}
              label={animal.name + (animal.species ? ' (' + animal.species + ')' : '')}
              selected={relatedId === animal.id}
              onPress={() => {
                setRelatedId(animal.id);
                setRelatedName(animal.name);
              }}
            />
          ))}
        </View>
        {animals.length === 0 ? (
          <AppText style={{ color: colors.textSecondary }}>
            No animals are registered yet. The record can still be saved without an animal link.
          </AppText>
        ) : null}
      </View>

      <View style={styles.section}>
        <AppText variant="headline">Record type</AppText>
        <View style={styles.chips}>
          {types.map(item => (
            <ChoiceChip
              key={item}
              label={item}
              selected={recordType === item}
              onPress={() => setRecordType(item)}
            />
          ))}
        </View>
      </View>

      <AppTextField label="Description" value={description} onChangeText={setDescription} placeholder="e.g. Annual FMD booster" />

      <View style={styles.row}>
        <View style={styles.grow}>
          <AppTextField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </View>
        <View style={styles.grow}>
          <AppTextField label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
        </View>
      </View>

      <AppTextField label="Vet / Officer" value={officer} onChangeText={setOfficer} placeholder="Vet / Officer name" />
      <AppTextField label="Cost (BWP)" value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="150" />

      <ChoiceChip
        label="Completed"
        selected={completed}
        onPress={() => setCompleted(value => !value)}
        icon="checkmark-circle-outline"
      />

      <AppButton title="Save Record" icon="checkmark" onPress={save} loading={loading} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  grow: { minWidth: 220, flex: 1 },
});
