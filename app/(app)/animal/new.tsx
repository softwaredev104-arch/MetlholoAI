import { useState } from 'react';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AnimalForm, type AnimalFormValue } from '@/components/farm/AnimalForm';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { farmDomain } from '@/services/farms/domainRepository';

export default function NewAnimal() {
  const { user, farm } = usePrimaryFarm();
  const [loading, setLoading] = useState(false);

  async function save(value: AnimalFormValue) {
    if (!user || !farm) return;
    setLoading(true);
    try {
      await farmDomain.animals.create(user.uid, farm.id, value);
      router.replace('/(app)/(tabs)/animals' as any);
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
      <AnimalForm onSubmit={save} loading={loading} submitLabel="Add Animal" />
    </AppScreen>
  );
}
