import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { useAuth } from '@/auth/AuthProvider';
import { deleteFarmRecord, listFarmRecords, type FarmRecord, type FarmRecordType } from '@/services/farms/farmRepository';
import { listDiagnoses, type DiagnosisRecord } from '@/services/intelligence/diagnosisRepository';
import { Spacing } from '@/design/spacing';

const labels: Record<FarmRecordType, string> = { animals: 'Animal', crops: 'Crop field', healthRecords: 'Health record', tasks: 'Farm task', feedingPlans: 'Feeding plan', marketplace: 'Marketplace listing' };

export default function FarmRecordDetail() {
  const { farmId, type, recordId } = useLocalSearchParams<{ farmId: string; type: FarmRecordType; recordId: string }>();
  const { firebaseUser } = useAuth();
  const [record, setRecord] = useState<FarmRecord | null>(null);
  const [related, setRelated] = useState<FarmRecord | null>(null);
  const [linkedRecords, setLinkedRecords] = useState<FarmRecord[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!firebaseUser || !farmId || !recordId || !type) return;
    setLoading(true);
    setError(null);
    try {
      const items = await listFarmRecords(firebaseUser.uid, farmId, type);
      const found = items.find(item => item.id === recordId) ?? null;
      setRecord(found);
      if (found?.relatedRecordId && (found.relatedRecordType === 'animals' || found.relatedRecordType === 'crops')) {
        const linked = await listFarmRecords(firebaseUser.uid, farmId, found.relatedRecordType);
        setRelated(linked.find(item => item.id === found.relatedRecordId) ?? null);
      } else setRelated(null);
      if (found && (type === 'animals' || type === 'crops')) {
        const collections: FarmRecordType[] = type === 'animals' ? ['healthRecords', 'feedingPlans', 'tasks'] : ['healthRecords', 'tasks'];
        const linked = (await Promise.all(collections.map(collection => listFarmRecords(firebaseUser.uid, farmId, collection)))).flat().filter(item => item.relatedRecordId === found.id && item.relatedRecordType === type);
        setLinkedRecords(linked);
        setDiagnoses((await listDiagnoses(firebaseUser.uid, farmId)).filter(item => item.sourceRecordType === type && item.sourceRecordId === found.id));
      } else {
        setLinkedRecords([]);
        setDiagnoses([]);
      }
    } catch (loadError) {
      setRecord(null);
      setRelated(null);
      setLinkedRecords([]);
      setDiagnoses([]);
      setError(loadError instanceof Error ? loadError.message : 'Could not load this record. Please try again.');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [firebaseUser?.uid, farmId, recordId, type]);

  function remove() {
    if (!farmId || !record || !type) return;
    Alert.alert('Delete record?', `Delete “${record.name}”? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteFarmRecord(farmId, type, record.id); router.back(); } catch (error) { Alert.alert('Could not delete', error instanceof Error ? error.message : 'Please remove linked history first, then try again.'); } } },
    ]);
  }

  if (!record && !loading) return <AppScreen><AppText variant="largeTitle">{error ? 'Record unavailable' : 'Record not found'}</AppText><AppText style={styles.muted}>{error ?? 'This record could not be found.'}</AppText><AppButton title="Retry" variant="secondary" loading={loading} onPress={load} /><AppButton title="Back" variant="secondary" onPress={() => router.back()} /></AppScreen>;
  if (!record) return <AppScreen><AppText variant="largeTitle">Loading…</AppText></AppScreen>;

  const canDiagnose = type === 'animals' || type === 'crops';
  return <AppScreen>
    <AppText variant="caption">{labels[type]}</AppText>
    <AppText variant="largeTitle">{record.name}</AppText>
    {record.status ? <AppText style={styles.muted}>Status: {record.status}</AppText> : null}
    {typeof record.category === 'string' && record.category ? <AppText style={styles.muted}>Category: {record.category}</AppText> : null}
    {record.quantity != null ? <AppText style={styles.muted}>Quantity: {record.quantity} {record.unit ?? ''}</AppText> : null}
    {record.notes ? <AppCard style={styles.card}><AppText variant="headline">Notes</AppText><AppText>{record.notes}</AppText></AppCard> : null}
    {(type === 'animals' || type === 'crops') ? <AppCard style={styles.card}><AppText variant="headline">Farm history</AppText><AppText style={styles.muted}>{linkedRecords.length} linked operational record{linkedRecords.length === 1 ? '' : 's'}</AppText>{linkedRecords.slice(0, 8).map(item => <Pressable key={`${item.type}-${item.id}`} onPress={() => router.push({ pathname: '/farm/[farmId]/[type]/[recordId]', params: { farmId, type: item.type, recordId: item.id } })}><AppText style={styles.link}>{item.name}</AppText></Pressable>)}<AppText style={styles.muted}>{diagnoses.length} diagnosis result{diagnoses.length === 1 ? '' : 's'}</AppText>{diagnoses.slice(0, 5).map(item => <AppText key={item.id}>{item.outcome} · {Math.round(item.confidence * 100)}%</AppText>)}</AppCard> : null}
    {related ? <AppCard style={styles.card}><AppText variant="headline">Related farm asset</AppText><AppText>{related.name}</AppText><AppText style={styles.muted}>{typeof related.category === 'string' ? related.category : ''}</AppText><AppButton title="Open related asset" variant="secondary" onPress={() => router.push({ pathname: '/farm/[farmId]/[type]/[recordId]', params: { farmId, type: related.type, recordId: related.id } })} /></AppCard> : null}
    {canDiagnose ? <AppButton title="Run AI diagnosis" onPress={() => router.push({ pathname: '/scan', params: { recordType: type, recordId: record.id } })} /> : null}
    <AppButton title="Edit record" variant="secondary" onPress={() => router.replace({ pathname: '/farm/[farmId]/[type]', params: { farmId, type, editRecordId: record.id, returnToDetail: 'true' } })} />
    <AppButton title="Delete record" variant="secondary" onPress={remove} />
    <AppButton title="Back to records" variant="secondary" onPress={() => router.back()} />
  </AppScreen>;
}

const styles = StyleSheet.create({ card: { marginTop: Spacing.lg, gap: Spacing.sm }, link: { fontWeight: '700' }, muted: { opacity: 0.65, marginTop: Spacing.sm } });