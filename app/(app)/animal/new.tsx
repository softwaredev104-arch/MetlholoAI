import { useState } from 'react';
import { uploadRecordPhotos } from '@/services/drive/recordPhotoService';
import { useTheme } from '@/design/themes';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AnimalForm, type AnimalFormValue } from '@/components/farm/AnimalForm';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';

export default function NewAnimal() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function save(value: AnimalFormValue) {
    if (!user || !farm) return;
    setLoading(true);
    setError('');
    try {
      const { photos, pendingPhotos, ...fields } = value;
      const uploaded = await uploadRecordPhotos(
        { ownerId: user.uid, farmId: farm.id, recordType: 'animals' },
        pendingPhotos,
      );
      await farmDomain.animals.create(user.uid, farm.id, {
        ...fields,
        photos: [...photos, ...uploaded],
      });
      router.replace('/(app)/(tabs)/animals' as any);
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : 'Save failed.') +
          ' If a record was created locally, check your animals before trying again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={820}>
      <AppText variant="largeTitle">Add Animal</AppText>
      <AppText>
        Register livestock once, then reuse it across health, feeding, diagnosis and reporting.
      </AppText>
      
      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}
      <AnimalForm
        photoContext={{ ownerId: user?.uid ?? '', farmId: farm?.id ?? '', recordType: 'animals' }}
        email={user?.email}
        onSubmit={save}
        loading={loading}
        submitLabel="Add Animal" />
    </AppScreen>
  );
}
