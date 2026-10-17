import { useState } from 'react';
import { uploadRecordPhotos } from '@/services/drive/recordPhotoService';
import { useTheme } from '@/design/themes';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { CropForm, type CropFormValue } from '@/components/farm/CropForm';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';

export default function NewCrop() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function save(value: CropFormValue) {
    if (!user || !farm) return;
    setLoading(true);
    setError('');
    try {
      const { photos, pendingPhotos, ...fields } = value;
      const uploaded = await uploadRecordPhotos(
        { ownerId: user.uid, farmId: farm.id, recordType: 'crops' },
        pendingPhotos,
      );
      await farmDomain.crops.create(user.uid, farm.id, {
        ...fields,
        photos: [...photos, ...uploaded],
      });
      router.replace('/(app)/crops' as any);
    } catch (e) {
      setError(
        (e instanceof Error ? e.message : 'Save failed.') +
          ' If a record was created locally, check your crops before trying again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={860}>
      <AppText variant="largeTitle">Add New Field</AppText>
      <AppText>Register a crop field on your farm.</AppText>
      
      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}
      <CropForm
        photoContext={{ ownerId: user?.uid ?? '', farmId: farm?.id ?? '', recordType: 'crops' }}
        email={user?.email}
        onSubmit={save}
        loading={loading}
        submitLabel="Add Field" />
    </AppScreen>
  );
}
