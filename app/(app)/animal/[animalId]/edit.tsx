import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !farm || !animalId) return;
    farmDomain.animals.list(user.uid, farm.id).then(items => {
      setAnimal(items.find(item => item.id === animalId) ?? null);
    });
  }, [user?.uid, farm?.id, animalId]);

  async function save(value: AnimalFormValue) {
    if (!user || !farm || !animal) return;
    setLoading(true);
    try {
      await farmDomain.animals.update(user.uid, farm.id, animal.id, value);
      router.replace({
        pathname: '/(app)/animal/[animalId]' as any,
        params: { animalId: animal.id },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={820}>
      <AppText variant="largeTitle">Edit Animal</AppText>
      {animal ? (
        <AnimalForm
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
