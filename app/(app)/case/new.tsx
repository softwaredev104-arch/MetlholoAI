import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { RecordPhotoField } from '@/components/farm/RecordPhotoField';
import { uploadRecordPhotos, type PendingPhoto, type StoredPhoto } from '@/services/drive/recordPhotoService';
import { ChoiceChip } from '@/components/app/ProductUI';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type AnimalRecord,
  type CropFieldRecord,
} from '@/services/farms/domainRepository';
import { createCase } from '@/services/cases/caseRepository';
import { prepareRegionalObservationDraft } from '@/services/cases/regionalObservation';
import { listDiagnoses } from '@/services/intelligence/diagnosisRepository';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const severities = ['Mild', 'Moderate', 'Severe', 'Critical'] as const;

type SubjectType = 'animal' | 'crop' | 'general';

export default function NewCase() {
  const params = useLocalSearchParams<{
    animalId?: string;
    animalName?: string;
    cropId?: string;
    cropName?: string;
    diagnosisId?: string;
  }>();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [crops, setCrops] = useState<CropFieldRecord[]>([]);
  const initialSubjectType: SubjectType = params.animalId
    ? 'animal'
    : params.cropId
      ? 'crop'
      : 'general';
  const [subjectType, setSubjectType] =
    useState<SubjectType>(initialSubjectType);
  const [subjectId, setSubjectId] = useState(
    params.animalId ?? params.cropId ?? '',
  );
  const [subjectName, setSubjectName] = useState(
    params.animalName ?? params.cropName ?? '',
  );
  const [disease, setDisease] = useState('');
  const [severity, setSeverity] =
    useState<(typeof severities)[number]>('Moderate');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [location, setLocation] = useState(farm?.location ?? '');
  const [notes, setNotes] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkedDiagnosisId, setLinkedDiagnosisId] = useState('');
  const [prepareRegional, setPrepareRegional] = useState(false);

  useEffect(() => {
    if (!user || !farm) return;
    Promise.all([
      farmDomain.animals.list(user.uid, farm.id),
      farmDomain.crops.list(user.uid, farm.id),
    ]).then(([nextAnimals, nextCrops]) => {
      setAnimals(nextAnimals);
      setCrops(nextCrops);
    });
  }, [user?.uid, farm?.id]);

  useEffect(() => {
    if (!user || !farm || !params.diagnosisId) return;
    let active = true;
    void listDiagnoses(user.uid, farm.id).then(records => {
      const matched = records.find(item =>
        item.id === params.diagnosisId &&
        item.ownerId === user.uid && item.farmId === farm.id
      );
      // Never trust a deep-link claim about diagnosis or farm ownership.
      if (!active || !matched) return;
      setLinkedDiagnosisId(matched.id);
      setDisease(matched.outcome === 'Uncertain' ? 'Uncertain AI finding' : matched.outcome);
      setSubjectType(matched.sourceRecordType === 'animals' ? 'animal' : 'crop');
      setSubjectId(matched.sourceRecordId === 'unlinked' ? '' : matched.sourceRecordId);
      setSubjectName(matched.sourceName);
      setNotes('AI-suggested observation (unverified). Model: ' + matched.modelName +
        '. Professional review is required before confirmation or public alerts.');
    }).catch(() => setError('Unable to load the saved diagnosis.'));
    return () => { active = false; };
  }, [user?.uid, farm?.id, params.diagnosisId]);

  function chooseSubject(
    type: SubjectType,
    id = '',
    name = '',
  ) {
    setSubjectType(type);
    setSubjectId(id);
    setSubjectName(name);
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
      const regionalDraft = prepareRegional
        ? prepareRegionalObservationDraft({
            district, disease, subjectType, status: 'open', severity,
            animalId: subjectType === 'animal' ? subjectId : undefined,
            cropId: subjectType === 'crop' ? subjectId : undefined,
          })
        : undefined;
      const uploaded = await uploadRecordPhotos(
        { ownerId: user.uid, farmId: farm.id, recordType: 'cases' },
        pendingPhotos,
      );
      const created = await createCase(user.uid, farm.id, {
        subjectType,
        subjectId: subjectId || undefined,
        subjectName: subjectName || undefined,
        animalId: subjectType === 'animal' ? subjectId || undefined : undefined,
        animalName:
          subjectType === 'animal' ? subjectName || undefined : undefined,
        cropId: subjectType === 'crop' ? subjectId || undefined : undefined,
        cropName:
          subjectType === 'crop' ? subjectName || undefined : undefined,
        disease: disease.trim(),
        sourceDiagnosisId: linkedDiagnosisId || undefined,
        verificationStatus: 'farmer_reported',
        regionalContribution: regionalDraft,
        severity,
        district: district.trim() || undefined,
        village: village.trim() || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        symptoms: symptoms.trim() || undefined,
        photos: [...photos, ...uploaded],
        status: 'open',
      });
      router.replace({
        pathname: '/(app)/case/[caseId]' as any,
        params: { caseId: created.id },
      });
    } catch (e) {
      setError((e instanceof Error ? e.message : 'Could not save case photos.') +
        ' Check existing cases before retrying.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={820}>
      <AppText variant="largeTitle">Create Case Record</AppText>
      <AppText style={{ color: colors.textSecondary }}>
        Log a private farm observation. AI findings are not official disease confirmations or regional outbreak alerts.
      </AppText>

      <View style={styles.section}>
        <AppText variant="headline">Animal or crop</AppText>
        <View style={styles.chips}>
          <ChoiceChip
            label="General farm case"
            selected={subjectType === 'general'}
            onPress={() => chooseSubject('general')}
          />
          {animals.map(animal => (
            <ChoiceChip
              key={'animal-' + animal.id}
              label={animal.name + (animal.species ? ' · ' + animal.species : '')}
              selected={subjectType === 'animal' && subjectId === animal.id}
              onPress={() => chooseSubject('animal', animal.id, animal.name)}
            />
          ))}
          {crops.map(crop => (
            <ChoiceChip
              key={'crop-' + crop.id}
              label={crop.name + (crop.cropType ? ' · ' + crop.cropType : '')}
              selected={subjectType === 'crop' && subjectId === crop.id}
              onPress={() => chooseSubject('crop', crop.id, crop.name)}
            />
          ))}
        </View>
      </View>

      <AppTextField
        label="Disease / problem"
        value={disease}
        onChangeText={setDisease}
        placeholder="Enter or select disease"
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
        label="Observed symptoms"
        value={symptoms}
        onChangeText={setSymptoms}
        placeholder="Visible signs, onset, frequency, affected animals or crops..."
        multiline
        numberOfLines={4}
      />

      <AppTextField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Symptoms, duration, observations..."
        multiline
        numberOfLines={5}
      />

      <RecordPhotoField
        context={{ ownerId: user?.uid ?? '', farmId: farm?.id ?? '', recordType: 'cases' }}
        email={user?.email}
        photos={photos}
        pending={pendingPhotos}
        onPhotosChange={setPhotos}
        onPendingChange={setPendingPhotos}
        label="Case evidence photos"
      />

      <View style={styles.section}>
        <AppText variant="headline">Regional research participation</AppText>
        <ChoiceChip
          label={prepareRegional ? 'Prepared privately' : 'Prepare this observation for future sharing'}
          selected={prepareRegional}
          onPress={() => setPrepareRegional(value => !value)}
        />
        <AppText style={{ color: colors.textSecondary }}>
          Optional. This only marks a private draft in your Google Drive.
          Nothing is sent to regional researchers, other farmers, or authorities.
          A separate review and consent step will be required before any future sharing.
        </AppText>
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
});
