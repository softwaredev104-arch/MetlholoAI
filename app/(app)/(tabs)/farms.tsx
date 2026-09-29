import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { createFarm, listFarms, type Farm } from '@/services/farms/farmRepository';
import { Spacing } from '@/design/spacing';

const actions = [
  ['All animals', 'animals', 'paw-outline'],
  ['All crops', 'crops', 'leaf-outline'],
  ['Health records', 'healthRecords', 'medkit-outline'],
  ['Farm tasks', 'tasks', 'checkmark-circle-outline'],
  ['Feeding plans', 'feedingPlans', 'nutrition-outline'],
  ['Marketplace', 'marketplace', 'storefront-outline'],
] as const;

export default function Farms() {
  const { firebaseUser } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!firebaseUser) return;
    setLoading(true);
    try { setFarms(await listFarms(firebaseUser.uid)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [firebaseUser?.uid]);

  async function addFarm() {
    if (!firebaseUser) return;
    const farm = await createFarm(firebaseUser.uid, { name: `${firebaseUser.displayName ?? 'My'} Farm` });
    setFarms(current => [...current, farm]);
  }

  const farm = farms[0];

  return (
    <AppScreen>
      <AppText variant="largeTitle">Farm</AppText>
      <AppText style={{ opacity: 0.7 }}>Manage your crops, animals, health, tasks, feeding and storefront from one owner-scoped workspace.</AppText>

      {!farm ? <AppButton title="Create your first farm" loading={loading} onPress={addFarm} /> : null}

      {farm ? (
        <>
          <AppCard><AppText variant="headline">{farm.name}</AppText><AppText style={{ opacity: 0.7 }}>{farm.location ?? 'Location not set'}</AppText></AppCard>
          <View style={styles.grid}>
            {actions.map(([title, type]) => (
              <AppCard key={type} style={styles.action} onTouchEnd={() => router.push({ pathname: '/farm/[farmId]/[type]', params: { farmId: farm.id, type } })}>
                <AppText variant="headline">{title}</AppText>
                <AppText style={{ opacity: 0.65 }}>Open</AppText>
              </AppCard>
            ))}
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }, action: { width: '47%', minHeight: 120, justifyContent: 'center' } });
