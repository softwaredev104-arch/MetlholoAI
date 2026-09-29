import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { useAuth } from '@/auth/AuthProvider';
import { listFarms, listFarmRecords, type FarmRecord, type FarmRecordType } from '@/services/farms/farmRepository';
import { Spacing } from '@/design/spacing';

const TYPES: FarmRecordType[] = ['animals','crops','healthRecords','feedingPlans','tasks','marketplace'];

export default function Dashboard() {
  const { firebaseUser } = useAuth();
  const [records, setRecords] = useState<Record<FarmRecordType, FarmRecord[]>>({
    animals: [], crops: [], healthRecords: [], feedingPlans: [], tasks: [], marketplace: [],
  });
  const [farmName, setFarmName] = useState('Farm');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    try {
      const farms = await listFarms(firebaseUser.uid);
      const farm = farms[0];
      if (!farm) return;
      setFarmName(farm.name);
      const result = await Promise.all(TYPES.map(type => listFarmRecords(firebaseUser.uid, farm.id, type)));
      setRecords(Object.fromEntries(TYPES.map((type, index) => [type, result[index]])) as Record<FarmRecordType, FarmRecord[]>);
    } finally { setLoading(false); }
  }, [firebaseUser?.uid]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const animals = records.animals.length;
  const crops = records.crops.length;
  const health = records.healthRecords.length;
  const feeding = records.feedingPlans.length;
  const tasksOpen = records.tasks.filter(r => !['done','completed','complete'].includes((r.status ?? '').toLowerCase())).length;
  const listings = records.marketplace.filter(r => (r.status ?? '').toLowerCase() !== 'sold').length;
  const cropQuantity = records.crops.reduce((sum, r) => sum + (typeof r.quantity === 'number' ? r.quantity : 0), 0);

  return (
    <AppScreen>
      <AppText variant="largeTitle">{farmName} Dashboard</AppText>
      <AppText style={styles.subtitle}>Live analytics calculated from your Firestore farm records.</AppText>

      <View style={styles.grid}>
        <Metric title="Animals" value={animals} />
        <Metric title="Crops" value={crops} />
        <Metric title="Health records" value={health} />
        <Metric title="Feeding plans" value={feeding} />
        <Metric title="Open tasks" value={tasksOpen} />
        <Metric title="Active listings" value={listings} />
      </View>

      <AppCard style={styles.card}>
        <AppText variant="headline">Crop quantity recorded</AppText>
        <AppText variant="largeTitle">{cropQuantity}</AppText>
        <AppText style={styles.muted}>Sum of crop quantities where a numeric quantity has been recorded.</AppText>
      </AppCard>

      <AppCard style={styles.card}>
        <AppText variant="headline">Health snapshot</AppText>
        <AppText>{health ? `${health} health records recorded for this farm.` : 'No health records yet.'}</AppText>
        <AppText style={styles.muted}>Future diagnosis results and confidence trends will appear here without replacing these real records.</AppText>
      </AppCard>

      <AppText variant="caption">{loading ? 'Refreshing…' : 'Updated from your farm data'}</AppText>
    </AppScreen>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return <AppCard style={styles.metric}><AppText style={styles.muted}>{title}</AppText><AppText variant="largeTitle">{value}</AppText></AppCard>;
}

const styles = StyleSheet.create({
  subtitle:{opacity:.7,marginBottom:Spacing.lg},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:Spacing.md},
  metric:{width:'47%',minHeight:110,justifyContent:'space-between'},
  card:{marginTop:Spacing.md},
  muted:{opacity:.65},
});
