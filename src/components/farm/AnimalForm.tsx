import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { ChoiceChip } from '@/components/app/ProductUI';
import type { AnimalRecord } from '@/services/farms/domainRepository';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

const speciesOptions = ['Cattle', 'Goat', 'Sheep', 'Chicken', 'Pig', 'Fish', 'Horse', 'Dog'];
const sexOptions = ['Female', 'Male'];
const purposeOptions = ['Milk', 'Meat', 'Breeding', 'Egg Production', 'Draft Power', 'Companion', 'Fish Farming', 'Wool'];
const healthOptions = ['Healthy', 'Sick', 'Recovering', 'Quarantine'];

export type AnimalFormValue = {
  name: string;
  species: string;
  breed: string;
  tag: string;
  age: string;
  weightKg?: number;
  sex: string;
  purpose: string;
  healthStatus: string;
  vaccinations: string[];
  lastCheckup: string;
  notes: string;
  status: string;
};

export function AnimalForm({
  initial,
  submitLabel = 'Save Animal',
  loading = false,
  onSubmit,
}: {
  initial?: Partial<AnimalRecord>;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (value: AnimalFormValue) => Promise<void> | void;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState(String(initial?.name ?? ''));
  const [species, setSpecies] = useState(String(initial?.species ?? 'Cattle'));
  const [breed, setBreed] = useState(String(initial?.breed ?? ''));
  const [tag, setTag] = useState(String(initial?.tag ?? ''));
  const [age, setAge] = useState(String(initial?.age ?? ''));
  const [weight, setWeight] = useState(
    initial?.weightKg !== undefined ? String(initial.weightKg) : '',
  );
  const [sex, setSex] = useState(String(initial?.sex ?? 'Female'));
  const [purpose, setPurpose] = useState(String(initial?.purpose ?? 'Breeding'));
  const [healthStatus, setHealthStatus] = useState(
    String(initial?.healthStatus ?? 'Healthy'),
  );
  const [vaccinations, setVaccinations] = useState(
    Array.isArray(initial?.vaccinations) ? initial!.vaccinations!.join(', ') : '',
  );
  const [lastCheckup, setLastCheckup] = useState(
    String(initial?.lastCheckup ?? ''),
  );
  const [notes, setNotes] = useState(String(initial?.notes ?? ''));
  const [error, setError] = useState('');

  async function submit() {
    if (name.trim().length < 2) {
      setError('Enter the animal name or group name.');
      return;
    }

    setError('');
    await onSubmit({
      name: name.trim(),
      species,
      breed: breed.trim(),
      tag: tag.trim(),
      age: age.trim(),
      weightKg: weight.trim() ? Number(weight) : undefined,
      sex,
      purpose,
      healthStatus,
      vaccinations: vaccinations
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
      lastCheckup: lastCheckup.trim(),
      notes: notes.trim(),
      status: healthStatus.toLowerCase(),
    });
  }

  return (
    <View style={styles.form}>
      <AppTextField label="Animal name" value={name} onChangeText={setName} placeholder="e.g. Bontle" />

      <View style={styles.section}>
        <AppText variant="headline">Species</AppText>
        <View style={styles.chips}>
          {speciesOptions.map(item => (
            <ChoiceChip
              key={item}
              label={item}
              selected={species === item}
              onPress={() => setSpecies(item)}
            />
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.grow}>
          <AppTextField label="Tag / ID" value={tag} onChangeText={setTag} placeholder="BW-001" />
        </View>
        <View style={styles.grow}>
          <AppTextField label="Breed" value={breed} onChangeText={setBreed} placeholder="Brahman" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.grow}>
          <AppTextField label="Age" value={age} onChangeText={setAge} placeholder="3 years" />
        </View>
        <View style={styles.grow}>
          <AppTextField
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="420"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="headline">Gender</AppText>
        <View style={styles.chips}>
          {sexOptions.map(item => (
            <ChoiceChip key={item} label={item} selected={sex === item} onPress={() => setSex(item)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="headline">Purpose</AppText>
        <View style={styles.chips}>
          {purposeOptions.map(item => (
            <ChoiceChip
              key={item}
              label={item}
              selected={purpose === item}
              onPress={() => setPurpose(item)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="headline">Health status</AppText>
        <View style={styles.chips}>
          {healthOptions.map(item => (
            <ChoiceChip
              key={item}
              label={item}
              selected={healthStatus === item}
              onPress={() => setHealthStatus(item)}
            />
          ))}
        </View>
      </View>

      <AppTextField
        label="Vaccinations"
        value={vaccinations}
        onChangeText={setVaccinations}
        placeholder="FMD, Anthrax, Brucellosis"
      />
      <AppTextField
        label="Last checkup date"
        value={lastCheckup}
        onChangeText={setLastCheckup}
        placeholder="YYYY-MM-DD"
      />
      <AppTextField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Health, production or breeding notes..."
        multiline
        numberOfLines={4}
      />

      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}

      <AppButton title={submitLabel} icon="checkmark" onPress={submit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.lg },
  section: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  grow: { minWidth: 220, flex: 1 },
});
