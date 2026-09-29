import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { createFarm, listFarms, type Farm } from '@/services/farms/farmRepository';
import { Spacing } from '@/design/spacing';

const actions = [
  ['All animals', 'animals', 'paw-outline', 'Manage livestock records'],
  ['All crops', 'crops', 'leaf-outline', 'Manage planted crops'],
  ['Health records', 'healthRecords', 'medkit-outline', 'Track health events'],
  ['Farm tasks', 'tasks', 'checkmark-circle-outline', 'Plan and complete work'],
  ['Feeding plans', 'feedingPlans', 'nutrition-outline', 'Manage feeding schedules'],
  ['Marketplace', 'marketplace', 'storefront-outline', 'Manage your storefront'],
] as const;

export default function Farms() {
  const { firebaseUser } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      setFarms(await listFarms(firebaseUser.uid));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [firebaseUser?.uid]);

  async function addFarm() {
    if (!firebaseUser) return;
    const farm = await createFarm(firebaseUser.uid, {
      name: `${firebaseUser.displayName ?? 'My'} Farm`,
    });
    setFarms(current => [...current, farm]);
  }

  const farm = farms[0];

  return (
    <AppScreen>
      <AppText variant="largeTitle">Farm</AppText>
      <AppText style={styles.subtitle}>
        Your owner-scoped farm workspace for crops, animals, health, tasks, feeding and selling.
      </AppText>

      {!farm ? <AppButton title="Create your first farm" loading={loading} onPress={addFarm} /> : null}

      {farm ? (
        <>
          <AppCard style={styles.farmHeader}>
            <AppText variant="headline">{farm.name}</AppText>
            <AppText style={styles.muted}>{farm.location ?? 'Location not set'}</AppText>
            <AppButton title="Open farm details" variant="secondary" onPress={() => router.push({ pathname: '/farm/[farmId]', params: { farmId: farm.id } })} />
            {farm.latitude != null && farm.longitude != null ? (
              <AppText style={styles.muted}>GPS {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}</AppText>
            ) : null}
          </AppCard>

          <View style={styles.grid}>
            {actions.map(([title, type, , description]) => (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityLabel={title}
                onPress={() => router.push({
                  pathname: '/farm/[farmId]/[type]',
                  params: { farmId: farm.id, type },
                })}
                style={({ pressed }) => [styles.actionPressable, { opacity: pressed ? 0.72 : 1 }]}
              >
                <AppCard style={styles.action}>
                  <AppText variant="headline">{title}</AppText>
                  <AppText style={styles.muted}>{description}</AppText>
                  <AppText style={styles.open}>Open →</AppText>
                </AppCard>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: { opacity: 0.7, marginBottom: Spacing.lg },
  farmHeader: { marginBottom: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionPressable: { width: '47%' },
  action: { minHeight: 138, justifyContent: 'space-between' },
  muted: { opacity: 0.65 },
  open: { marginTop: Spacing.sm, fontWeight: '700' },
});
