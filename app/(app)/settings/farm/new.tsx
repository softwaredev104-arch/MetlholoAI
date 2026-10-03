import { useState } from 'react';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import {
  FarmProfileForm,
  type FarmProfileValue,
} from '@/components/farm/FarmProfileForm';
import { useAuth } from '@/auth/AuthProvider';
import { createFarm, listFarms } from '@/services/farms/farmRepository';
import { updateUserProfile } from '@/services/auth/userProfileService';

export default function NewFarmSettings() {
  const { firebaseUser, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  async function save(value: FarmProfileValue) {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const before = await listFarms(firebaseUser.uid);
      await createFarm(firebaseUser.uid, value);

      if (before.length === 0) {
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
      <AppText variant="largeTitle">Add Farm</AppText>
      <AppText>
        Register another farm location and keep its records separated by farm.
      </AppText>

      <FarmProfileForm
        submitLabel="Add Farm"
        loading={saving}
        onSubmit={save}
      />
    </AppScreen>
  );
}
