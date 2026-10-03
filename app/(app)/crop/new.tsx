import { useState } from 'react';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { CropForm, type CropFormValue } from '@/components/farm/CropForm';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';

export default function NewCrop() {
  const { user, farm } = usePrimaryFarm();
  const [loading, setLoading] = useState(false);

  async function save(value: CropFormValue) {
    if (!user || !farm) return;
    setLoading(true);
    try {
      await farmDomain.crops.create(user.uid, farm.id, value);
      router.replace('/(app)/crops' as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={860}>
      <AppText variant="largeTitle">Add New Field</AppText>
      <AppText>Register a crop field on your farm.</AppText>
      <CropForm onSubmit={save} loading={loading} submitLabel="Add Field" />
    </AppScreen>
  );
}
