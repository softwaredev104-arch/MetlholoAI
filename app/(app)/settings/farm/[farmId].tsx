import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import {
  FarmProfileForm,
  type FarmProfileValue,
} from '@/components/farm/FarmProfileForm';
import { useAuth } from '@/auth/AuthProvider';
import {
  listFarms,
  updateFarm,
  type Farm,
} from '@/services/farms/farmRepository';
import { updateUserProfile } from '@/services/auth/userProfileService';

export default function EditFarmSettings() {
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const { firebaseUser, refreshProfile } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!firebaseUser || !farmId) return;
    listFarms(firebaseUser.uid).then(items => {
      setFarm(items.find(item => item.id === farmId) ?? null);
      setIsPrimary(items.at(0)?.id === farmId);
    });
  }, [firebaseUser?.uid, farmId]);

  async function save(value: FarmProfileValue) {
    if (!firebaseUser || !farm) return;
    setSaving(true);
    try {
      await updateFarm(firebaseUser.uid, farm.id, value);

      if (isPrimary) {
        await updateUserProfile(firebaseUser.uid, {
          farmName: value.name,
          farmType: value.farmType,
          farmSizeBand: value.farmSizeBand,
          locationLabel: value.location,
        });
        await refreshProfile();
      }

      router.replace('/(app)/settings/farms' as any);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen maxWidth={780}>
      <AppText variant="largeTitle">Edit Farm</AppText>
      {isPrimary ? <AppText>Primary farm used by the Home dashboard.</AppText> : null}

      {farm ? (
        <FarmProfileForm
          initial={farm}
          submitLabel="Save Farm"
          loading={saving}
          onSubmit={save}
        />
      ) : (
        <AppText>Loading farm profile…</AppText>
      )}
    </AppScreen>
  );
}
