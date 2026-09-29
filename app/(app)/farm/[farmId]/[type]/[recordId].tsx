import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { deleteFarmRecord, listFarmRecords, type FarmRecord, type FarmRecordType } from '@/services/farms/farmRepository';
import { Spacing } from '@/design/spacing';

const labels: Record<FarmRecordType, string> = { animals: 'Animal', crops: 'Crop field', healthRecords: 'Health record', tasks: 'Farm task', feedingPlans: 'Feeding plan', marketplace: 'Marketplace listing' };

export default function FarmRecordDetail() {
  const { farmId, type, recordId } = useLocalSearchParams<{ farmId: string; type: FarmRecordType; recordId: string }>();
  const { firebaseUser } = useAuth();
  const [record, setRecord] = useState<FarmRecord | null>(null);
  const [related, setRelated] = useState<FarmRecord | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!firebaseUser || !farmId || !recordId || !type) return;
    setLoading(true);
    try {
      const items = await listFarmRecords(firebaseUser.uid, farmId, type);
      const found = items.find(item => item.id === recordId) ?? null;
      setRecord(found);
      if (found?.relatedRecordId && (found.relatedRecordType === 'animals' || found.relatedRecordType === 'crops')) {
        const linked = await listFarmRecords(firebaseUser.uid, farmId, found.relatedRecordType);
        setRelated(linked.find(item => item.id === found.relatedRecordId) ?? null);
      } else setRelated(null);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [firebaseUser?.uid, farmId, recordId, type]);

  async function remove() {
    if (!farmId || !record || !type) return;
    Alert.alert('Delete record?', `Delete “${record.name}”? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteFarmRecord(farmId, type, record.id); router.back(); } },
    ]);
  }

  if (!record && !loading) return <AppScreen><AppText variant="largeTitle">Record not found</AppText><AppButton title="Back" variant="secondary" onPress={() => router.back()} /></AppScreen>;
  if (!record) return <AppScreen><AppText variant="largeTitle">Loading…</AppText></AppScreen>;

  const canDiagnose = type === 'animals' || type === 'crops';
  return <AppScreen>
    <AppText variant="caption">{labels[type]}</AppText>
    <AppText variant="largeTitle">{record.name}</AppText>
    {record.status ? <AppText style={styles.muted}>Status: {record.status}</AppText> : null}
    {record.category ? <AppText style={styles.muted}>Category: {String(record.category)}</AppText> : null}
    {record.quantity != null ? <AppText style={styles.muted}>Quantity: {record.quantity} {record.unit ?? ''}</AppText> : null}
    {record.notes ? <AppCard style={styles.card}><AppText variant="headline">Notes</AppText><AppText>{record.notes}</AppText></AppCard> : null}
    {related ? <AppCard style={styles.card}><AppText variant="headline">Related farm asset</AppText><AppText>{related.name}</AppText><AppText style={styles.muted}>{related.category ? String(related.category) : ''}</AppText><AppButton title="Open related asset" variant="secondary" onPress={() => router.push({ pathname: '/farm/[farmId]/[type]/[recordId]', params: { farmId, type: related.type, recordId: related.id } })} /></AppCard> : null}
    {canDiagnose ? <AppButton title="Run AI diagnosis" onPress={() => router.push({ pathname: '/scan', params: { recordType: type, recordId: record.id } })} /> : null}
    <AppButton title="Edit record" variant="secondary" onPress={() => router.back()} />
    <AppButton title="Delete record" variant="secondary" onPress={remove} />
    <AppButton title="Back to records" variant="secondary" onPress={() => router.back()} />
  </AppScreen>;
}

const styles = StyleSheet.create({ card: { marginTop: Spacing.lg, gap: Spacing.sm }, muted: { opacity: 0.65, marginTop: Spacing.sm } });