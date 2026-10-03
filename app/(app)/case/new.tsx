import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { ChoiceChip } from '@/components/app/ProductUI';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type AnimalRecord,
} from '@/services/farms/domainRepository';
import { createCase } from '@/services/cases/caseRepository';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const severities = ['Mild', 'Moderate', 'Severe', 'Critical'] as const;

export default function NewCase() {
  const params = useLocalSearchParams<{
    animalId?: string;
    animalName?: string;
  }>();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [animalId, setAnimalId] = useState(params.animalId ?? '');
  const [animalName, setAnimalName] = useState(params.animalName ?? '');
  const [disease, setDisease] = useState('');
  const [severity, setSeverity] =
    useState<(typeof severities)[number]>('Moderate');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [location, setLocation] = useState(farm?.location ?? '');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !farm) return;
    farmDomain.animals.list(user.uid, farm.id).then(setAnimals);
  }, [user?.uid, farm?.id]);

  async function addPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      setPhotos(current => [
        ...current,
        ...result.assets.map(asset => asset.uri),
      ].slice(0, 5));
    }
  }

  async function save() {
    if (!user || !farm) return;
    if (disease.trim().length < 2) {
      setError('Enter the suspected disease or health problem.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const created = await createCase(user.uid, farm.id, {
        animalId: animalId || undefined,
        animalName: animalName || undefined,
        disease: disease.trim(),
        severity,
        district: district.trim() || undefined,
        village: village.trim() || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        photos,
        status: 'open',
      });
      router.replace({
        pathname: '/(app)/case/[caseId]' as any,
        params: { caseId: created.id },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={820}>
      <AppText variant="largeTitle">Create Case Record</AppText>
      <AppText style={{ color: colors.textSecondary }}>
        Record an animal health issue and link follow-up treatment to the same case.
      </AppText>

      <View style={styles.section}>
        <AppText variant="headline">Animal</AppText>
        <View style={styles.chips}>
          <ChoiceChip
            label="General farm case"
            selected={!animalId}
            onPress={() => {
              setAnimalId('');
              setAnimalName('');
            }}
          />
          {animals.map(animal => (
            <ChoiceChip
              key={animal.id}
              label={animal.name}
              selected={animalId === animal.id}
              onPress={() => {
                setAnimalId(animal.id);
                setAnimalName(animal.name);
              }}
            />
          ))}
        </View>
      </View>

      <AppTextField
        label="Disease / problem"
        value={disease}
        onChangeText={setDisease}
        placeholder="e.g. Lumpy skin lesions"
      />

      <View style={styles.section}>
        <AppText variant="headline">Severity</AppText>
        <View style={styles.chips}>
          {severities.map(item => (
            <ChoiceChip
              key={item}
              label={item}
              selected={severity === item}
              onPress={() => setSeverity(item)}
            />
          ))}
        </View>
      </View>

      <LocationPicker
        value={location}
        onSelect={next => setLocation(next.label)}
      />

      <View style={styles.row}>
        <View style={styles.grow}>
          <AppTextField
            label="District"
            value={district}
            onChangeText={setDistrict}
            placeholder="District"
          />
        </View>
        <View style={styles.grow}>
          <AppTextField
            label="Village"
            value={village}
            onChangeText={setVillage}
            placeholder="Village"
          />
        </View>
      </View>

      <AppTextField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Symptoms, duration, observations..."
        multiline
        numberOfLines={5}
      />

      <View style={styles.section}>
        <AppText variant="headline">Photos</AppText>
        <AppButton
          title="Add Photos"
          variant="secondary"
          icon="images-outline"
          onPress={addPhoto}
        />
        <View style={styles.photos}>
          {photos.map(uri => (
            <Image key={uri} source={{ uri }} style={styles.photo} />
          ))}
        </View>
      </View>

      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}
      <AppButton
        title="Save Case Record"
        icon="checkmark"
        onPress={save}
        loading={loading}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  grow: { minWidth: 220, flex: 1 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photo: { width: 100, height: 100, borderRadius: 14 },
});
