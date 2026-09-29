import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { ANIMALS, CROPS, INTELLIGENCE_DISEASES_AND_PESTS, VACCINES, FERTILIZERS, FEED_TYPES, UNITS, TASK_TYPES, MARKETPLACE_CATEGORIES, getOptionsForCrop } from '@/data/agricultureDictionary';
import { useAuth } from '@/auth/AuthProvider';
import {
  createFarmRecord,
  deleteFarmRecord,
  listFarmRecords,
  updateFarmRecord,
  type FarmRecord,
  type FarmRecordType,
} from '@/services/farms/farmRepository';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const labels: Record<FarmRecordType, string> = {
  animals: 'Animals',
  crops: 'Crops',
  healthRecords: 'Health records',
  tasks: 'Farm tasks',
  feedingPlans: 'Feeding plans',
  marketplace: 'Marketplace',
};

const singular: Record<FarmRecordType, string> = {
  animals: 'animal',
  crops: 'crop',
  healthRecords: 'health record',
  tasks: 'task',
  feedingPlans: 'feeding plan',
  marketplace: 'listing',
};

export default function FarmRecords() {
  const { colors } = useTheme();
  const { farmId, type, editRecordId } = useLocalSearchParams<{ farmId: string; type: FarmRecordType; editRecordId?: string }>();
  const { firebaseUser } = useAuth();
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<FarmRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [model, setModel] = useState('');
  const [relatedRecordId, setRelatedRecordId] = useState('');
  const [relatedRecordType, setRelatedRecordType] = useState<'animals' | 'crops' | ''>('');
  const [relatedRecords, setRelatedRecords] = useState<FarmRecord[]>([]);

  const validType = useMemo(() => type && type in labels ? type : null, [type]);

  async function load() {
    if (!firebaseUser || !farmId || !validType) return;
    setRecords(await listFarmRecords(firebaseUser.uid, farmId, validType));
  }

  useEffect(() => { load(); }, [firebaseUser?.uid, farmId, validType]);

  useEffect(() => {
    if (!editRecordId || !records.length) return;
    const record = records.find(item => item.id === editRecordId);
    if (record) openEdit(record);
  }, [editRecordId, records.length]);

  useEffect(() => {
    if (!firebaseUser || !farmId || !validType || !['healthRecords', 'tasks', 'feedingPlans'].includes(validType)) return;
    Promise.all([
      listFarmRecords(firebaseUser.uid, farmId, 'animals'),
      listFarmRecords(firebaseUser.uid, farmId, 'crops'),
    ]).then(([animals, crops]) => setRelatedRecords(validType === 'feedingPlans' ? animals : [...animals, ...crops])).catch(() => setRelatedRecords([]));
  }, [firebaseUser?.uid, farmId, validType]);

  function openCreate() {
    setEditing(null);
    setName('');
    setNotes('');
    setStatus('');
    setQuantity('');
    setUnit('');
    setCategory('');
    setModel('');
    setRelatedRecordId('');
    setRelatedRecordType('');
    setModalOpen(true);
  }

  function openEdit(record: FarmRecord) {
    setEditing(record);
    setName(record.name);
    setNotes(record.notes ?? '');
    setStatus(record.status ?? '');
    setQuantity(record.quantity == null ? '' : String(record.quantity));
    setUnit(record.unit ?? '');
    setCategory(String(record.category ?? ''));
    setModel(String(record.model ?? ''));
    setRelatedRecordId(String(record.relatedRecordId ?? ''));
    setRelatedRecordType(record.relatedRecordType === 'animals' || record.relatedRecordType === 'crops' ? record.relatedRecordType : '');
    setModalOpen(true);
  }

  async function save() {
    if (!firebaseUser || !farmId || !validType || !name.trim()) return;
    setLoading(true);
    try {
      const input = {
        name: name.trim(),
        notes: notes.trim(),
        status: status.trim(),
        quantity: quantity.trim() ? Number(quantity) : undefined,
        unit: unit.trim() || undefined,
        category: category || undefined,
        model: model || undefined,
        relatedRecordType: relatedRecordType || undefined,
        relatedRecordId: relatedRecordId || undefined,
        relatedRecordName: relatedRecordId ? relatedRecords.find(item => item.id === relatedRecordId)?.name : undefined,
      };
      if (editing) {
        await updateFarmRecord(farmId, validType, editing.id, input);
      } else {
        const record = await createFarmRecord(firebaseUser.uid, farmId, validType, input);
        setRecords(current => [record, ...current]);
      }
      if (editing) await load();
      setModalOpen(false);
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function openRecord(record: FarmRecord) {
    router.push({ pathname: '/farm/[farmId]/[type]/[recordId]', params: { farmId, type: validType!, recordId: record.id } });
  }

  function remove(record: FarmRecord) {
    if (!farmId || !validType) return;
    Alert.alert('Delete record?', `Delete “${record.name}”? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFarmRecord(farmId, validType, record.id);
            setRecords(current => current.filter(item => item.id !== record.id));
          } catch (error) {
            Alert.alert('Could not delete', error instanceof Error ? error.message : 'Please try again.');
          }
        },
      },
    ]);
  }

  if (!validType) {
    return (
      <AppScreen>
        <AppText variant="largeTitle">Farm</AppText>
        <AppText>That farm section does not exist.</AppText>
        <AppButton title="Back to farm" variant="secondary" onPress={() => router.back()} />
      </AppScreen>
    );
  }

  const label = labels[validType];
  const filteredRecords = records.filter(record => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [record.name, record.category, record.status, record.notes, record.relatedRecordName].filter(Boolean).some(value => String(value).toLowerCase().includes(query));
  });

  return (
    <AppScreen>
      <AppText variant="largeTitle">{label}</AppText>
      <AppText style={styles.subtitle}>
        Create, edit and delete your {singular[validType]} records. All records are scoped to this farm and owner.
      </AppText>
      <AppButton title={`Add ${singular[validType]}`} loading={loading} onPress={openCreate} />
      <TextInput value={search} onChangeText={setSearch} placeholder={`Search ${label.toLowerCase()}...`} placeholderTextColor={colors.textTertiary} style={[styles.input, styles.searchInput, { color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel={`Search ${label}`} />

      {filteredRecords.map(record => (
        <AppCard key={record.id} style={styles.record}>
          <View style={styles.row}>
            <View style={styles.grow}>
              <AppText variant="headline">{record.name}</AppText>
              {record.status ? <AppText style={styles.muted}>{record.status}</AppText> : null}
              {record.quantity != null ? <AppText style={styles.muted}>{record.quantity} {record.unit ?? ''}</AppText> : null}
              {record.notes ? <AppText style={styles.notes}>{record.notes}</AppText> : null}
            </View>
            <View style={styles.actions}>
              {(validType === 'animals' || validType === 'crops') ? (
                <Pressable
                  onPress={() => router.push({ pathname: '/scan', params: { recordType: validType, recordId: record.id } })}
                  accessibilityRole="button"
                >
                  <AppText style={styles.link}>Diagnose</AppText>
                </Pressable>
              ) : null}
              <Pressable onPress={() => openRecord(record)} accessibilityRole="button">
                <AppText style={styles.link}>Open</AppText>
              </Pressable>
              <Pressable onPress={() => openEdit(record)} accessibilityRole="button">
                <AppText style={styles.link}>Edit</AppText>
              </Pressable>
              <Pressable onPress={() => remove(record)} accessibilityRole="button">
                <AppText style={styles.delete}>Delete</AppText>
              </Pressable>
            </View>
          </View>
        </AppCard>
      ))}

      {!records.length ? <AppText style={styles.empty}>No records yet. Add your first {singular[validType]}.</AppText> : null}
      {records.length > 0 && !filteredRecords.length ? <AppText style={styles.empty}>No {singular[validType]} records match “{search}”.</AppText> : null}
      <AppButton title="Back to farm" variant="secondary" onPress={() => router.back()} />

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <AppText variant="title2">{editing ? `Edit ${singular[validType]}` : `Add ${singular[validType]}`}</AppText>
            {validType === 'animals' ? <OptionPicker label="Animal category" options={ANIMALS} selected={ANIMALS.find(o=>o.label===category)?.id??''} onChange={(id)=>{const label=ANIMALS.find(o=>o.id===id)?.label??'';setCategory(label);if(!name)setName(label);}} /> : null}
            {validType === 'crops' ? <OptionPicker label="Crop" options={CROPS} selected={CROPS.find(o=>o.label===category)?.id??''} onChange={(id)=>{const label=CROPS.find(o=>o.id===id)?.label??'';setCategory(label);setModel('');if(!name)setName(label);}} /> : null}
            {validType === 'crops' && category ? <OptionPicker label="Available intelligence model" options={getOptionsForCrop(category).map(option=>({id:option.id,label:option.label,description:option.disease}))} selected={model} onChange={(id)=>setModel(String(id))} /> : null}
            {validType === 'healthRecords' ? <OptionPicker label="Condition / disease / pest" options={INTELLIGENCE_DISEASES_AND_PESTS} selected={INTELLIGENCE_DISEASES_AND_PESTS.find(o=>o.label===category)?.id??''} onChange={(id)=>{const label=INTELLIGENCE_DISEASES_AND_PESTS.find(o=>o.id===id)?.label??'';setCategory(label);if(!name)setName(label);}} /> : null}
            {(validType === 'healthRecords' || validType === 'tasks' || validType === 'feedingPlans') ? <OptionPicker label="Related farm asset" options={relatedRecords.map(item => ({ id: `${item.type}:${item.id}`, label: item.name, group: item.type === 'animals' ? 'Animal' : 'Crop field' }))} selected={relatedRecordType && relatedRecordId ? `${relatedRecordType}:${relatedRecordId}` : ''} onChange={(id)=>{ const [nextType, nextId] = String(id).split(':'); if (nextType === 'animals' || nextType === 'crops') { setRelatedRecordType(nextType); setRelatedRecordId(nextId ?? ''); } }} /> : null}
            {validType === 'feedingPlans' ? <OptionPicker label="Feed type" options={FEED_TYPES} selected={FEED_TYPES.find(o=>o.label===category)?.id??''} onChange={(id)=>{const label=FEED_TYPES.find(o=>o.id===id)?.label??'';setCategory(label);if(!name)setName(label);}} /> : null}
            {validType === 'tasks' ? <OptionPicker label="Task type" options={TASK_TYPES} selected={TASK_TYPES.find(o=>o.label===category)?.id??''} onChange={(id)=>{const label=TASK_TYPES.find(o=>o.id===id)?.label??'';setCategory(label);if(!name)setName(label);}} /> : null}
            {validType === 'marketplace' ? <OptionPicker label="Marketplace category" options={MARKETPLACE_CATEGORIES} selected={MARKETPLACE_CATEGORIES.find(o=>o.label===category)?.id??''} onChange={(id)=>setCategory(MARKETPLACE_CATEGORIES.find(o=>o.id===id)?.label??'')} /> : null}
            {validType === 'marketplace' && category === 'Vaccines' ? <OptionPicker label="Vaccine" options={VACCINES} selected={VACCINES.find(o=>o.label===name)?.id??''} onChange={(id)=>setName(VACCINES.find(o=>o.id===id)?.label??'')} /> : null}
            {validType === 'marketplace' && category === 'Fertilizers' ? <OptionPicker label="Fertilizer" options={FERTILIZERS} selected={FERTILIZERS.find(o=>o.label===name)?.id??''} onChange={(id)=>setName(FERTILIZERS.find(o=>o.id===id)?.label??'')} /> : null}
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={validType === 'marketplace' ? 'Name / identifier (optional when a category is selected)' : `${singular[validType]} name or identifier`}
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            />
            <TextInput
              value={status}
              onChangeText={setStatus}
              placeholder={validType === 'marketplace' ? 'For sale / sold / draft' : 'Status (optional)'}
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            />
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="Quantity (optional)"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            />
            <OptionPicker label="Unit" options={UNITS} selected={UNITS.find(o=>o.label===unit)?.id??''} onChange={(id)=>setUnit(String(id))} />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder={validType === 'marketplace' ? 'Description, price, pickup details...' : 'Notes'}
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, styles.notesInput, { color: colors.textPrimary, borderColor: colors.border }]}
            />
            <View style={styles.modalActions}>
              <AppButton title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} />
              <AppButton title={editing ? 'Save changes' : 'Create'} loading={loading} disabled={!name.trim()} onPress={save} />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: { opacity: 0.7, marginBottom: Spacing.lg },
  record: { marginTop: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  grow: { flex: 1 },
  actions: { gap: Spacing.sm, alignItems: 'flex-end' },
  link: { fontWeight: '700' },
  delete: { color: '#C62828', fontWeight: '700' },
  muted: { opacity: 0.65, marginTop: 2 },
  notes: { marginTop: Spacing.sm },
  empty: { opacity: 0.6, marginVertical: Spacing.lg },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, gap: Spacing.md },
  searchInput: { marginTop: Spacing.md },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.md, fontSize: 16 },
  notesInput: { minHeight: 90, textAlignVertical: 'top', paddingTop: Spacing.md },
  modalActions: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
});
