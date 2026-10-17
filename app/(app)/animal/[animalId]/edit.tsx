import { useEffect, useState } from 'react';
import {
  recordPhotoService,
  uploadRecordPhotos,
} from '@/services/drive/recordPhotoService';
import { useTheme } from '@/design/themes';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AnimalForm, type AnimalFormValue } from '@/components/farm/AnimalForm';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type AnimalRecord,
} from '@/services/farms/domainRepository';

export default function EditAnimal() {
  const { animalId } = useLocalSearchParams<{ animalId: string }>();
  const { user, farm } = usePrimaryFarm();
  const [animal, setAnimal] = useState<AnimalRecord | null>(null);
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !farm || !animalId) return;
    farmDomain.animals.list(user.uid, farm.id).then(items => {
      setAnimal(items.find(item => item.id === animalId) ?? null);
    });
  }, [user?.uid, farm?.id, animalId]);

  async function save(value: AnimalFormValue) {
    if (!user || !farm || !animal) return;
    setLoading(true);
    setError('');
    try {
      const context = { ownerId: user.uid, farmId: farm.id, recordType: 'animals' as const };
      const { photos, pendingPhotos, ...fields } = value;
      const uploaded = await uploadRecordPhotos(context, pendingPhotos);
      await farmDomain.animals.update(user.uid, farm.id, animal.id, {
        ...fields,
        photos: [...photos, ...uploaded],
      });
      // Removing a photo from a saved record also removes its private Drive
      // file. Do this only after the record metadata has been saved.
      const removed = (animal.photos ?? []).filter(
        image => !photos.some(kept => kept.id === image.id),
      );
      await Promise.allSettled(removed.map(image => recordPhotoService.remove(context, image)));
      router.replace({
        pathname: '/(app)/animal/[animalId]' as any,
        params: { animalId: animal.id },
      });
    } catch (e) {
      setError((e instanceof Error ? e.message : 'Unable to save changes.') +
        ' Your local record may have been saved; review it before retrying.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={820}>
      <AppText variant="largeTitle">Edit Animal</AppText>

      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}
      {animal ? (
        <AnimalForm
          photoContext={{ ownerId: user?.uid ?? '', farmId: farm?.id ?? '', recordType: 'animals' }}
          email={user?.email}
          initial={animal}
          onSubmit={save}
          loading={loading}
          submitLabel="Save Changes"
        />
      ) : (
        <AppText>Loading animal…</AppText>
      )}
    </AppScreen>
  );
}
