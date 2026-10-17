import { useEffect, useState } from 'react';
import {
  recordPhotoService,
  uploadRecordPhotos,
} from '@/services/drive/recordPhotoService';
import { useTheme } from '@/design/themes';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { CropForm, type CropFormValue } from '@/components/farm/CropForm';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type CropFieldRecord,
} from '@/services/farms/domainRepository';

export default function EditCrop() {
  const { cropId } = useLocalSearchParams<{ cropId: string }>();
  const { user, farm } = usePrimaryFarm();
  const [field, setField] = useState<CropFieldRecord | null>(null);
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !farm || !cropId) return;
    farmDomain.crops.list(user.uid, farm.id).then(items => {
      setField(items.find(item => item.id === cropId) ?? null);
    });
  }, [user?.uid, farm?.id, cropId]);

  async function save(value: CropFormValue) {
    if (!user || !farm || !field) return;
    setLoading(true);
    setError('');
    try {
      const context = { ownerId: user.uid, farmId: farm.id, recordType: 'crops' as const };
      const { photos, pendingPhotos, ...fields } = value;
      const uploaded = await uploadRecordPhotos(context, pendingPhotos);
      await farmDomain.crops.update(user.uid, farm.id, field.id, {
        ...fields,
        photos: [...photos, ...uploaded],
      });
      // Removing a photo from a saved record also removes its private Drive
      // file. Do this only after the record metadata has been saved.
      const removed = (field.photos ?? []).filter(
        image => !photos.some(kept => kept.id === image.id),
      );
      await Promise.allSettled(removed.map(image => recordPhotoService.remove(context, image)));
      router.replace({
        pathname: '/(app)/crop/[cropId]' as any,
        params: { cropId: field.id },
      });
    } catch (e) {
      setError((e instanceof Error ? e.message : 'Unable to save changes.') +
        ' Your local record may have been saved; review it before retrying.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={860}>
      <AppText variant="largeTitle">Edit Crop Details</AppText>

      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}
      {field ? (
        <CropForm
          photoContext={{ ownerId: user?.uid ?? '', farmId: farm?.id ?? '', recordType: 'crops' }}
          email={user?.email}
          initial={field}
          onSubmit={save}
          loading={loading}
          submitLabel="Save Changes"
        />
      ) : (
        <AppText>Loading field…</AppText>
      )}
    </AppScreen>
  );
}
