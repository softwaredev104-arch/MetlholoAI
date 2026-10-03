import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !farm || !cropId) return;
    farmDomain.crops.list(user.uid, farm.id).then(items => {
      setField(items.find(item => item.id === cropId) ?? null);
    });
  }, [user?.uid, farm?.id, cropId]);

  async function save(value: CropFormValue) {
    if (!user || !farm || !field) return;
    setLoading(true);
    try {
      await farmDomain.crops.update(user.uid, farm.id, field.id, value);
      router.replace({
        pathname: '/(app)/crop/[cropId]' as any,
        params: { cropId: field.id },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={860}>
      <AppText variant="largeTitle">Edit Crop Details</AppText>
      {field ? (
        <CropForm
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
