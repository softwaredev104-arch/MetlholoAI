import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { createFarmRecord, listFarmRecords, type FarmRecord, type FarmRecordType } from '@/services/farms/farmRepository';

const labels: Record<FarmRecordType, string> = {
  animals: 'Animals', crops: 'Crops', healthRecords: 'Health records', tasks: 'Farm tasks', feedingPlans: 'Feeding plans', marketplace: 'Marketplace',
};

export default function FarmRecords() {
  const { farmId, type } = useLocalSearchParams<{ farmId: string; type: FarmRecordType }>();
  const { user } = useAuth();
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const label = labels[type];

  async function load() {
    if (!user || !farmId || !type) return;
    setRecords(await listFarmRecords(user.id, farmId, type));
  }
  useEffect(() => { void load(); }, [user?.id, farmId, type]);

  async function add() {
    if (!user || !farmId || !type) return;
    setLoading(true);
    try {
      const record = await createFarmRecord(user.id, farmId, type, { name: `New ${label.slice(0, -1)}`, notes: '' });
      setRecords(current => [...current, record]);
    } finally { setLoading(false); }
  }

  return (
    <AppScreen>
      <AppText variant="largeTitle">{label}</AppText>
      <AppText style={{ opacity: 0.7 }}>Owner-scoped local records for this farm.</AppText>
      <AppButton title={`Add ${label.slice(0, -1)}`} loading={loading} onPress={add} />
      {records.map(record => <AppCard key={record.id}><AppText variant="headline">{record.name}</AppText><AppText>{record.notes || 'No notes yet.'}</AppText></AppCard>)}
      {!records.length ? <AppText style={{ opacity: 0.6 }}>No records yet.</AppText> : null}
      <AppButton title="Back to farm" variant="secondary" onPress={() => router.back()} />
    </AppScreen>
  );
}
