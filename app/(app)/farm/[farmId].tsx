import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { OptionPicker } from '@/components/ui/OptionPicker';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { FARM_TYPES } from '@/data/agricultureDictionary';
import { useAuth } from '@/auth/AuthProvider';
import { deleteFarm, listFarms, updateFarm, type Farm } from '@/services/farms/farmRepository';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function FarmDetail() {
  const { colors } = useTheme();
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const { firebaseUser } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [size, setSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState('');
  const [farmType, setFarmType] = useState('');
  const [description, setDescription] = useState('');

  async function load() {
    if (!firebaseUser || !farmId) return;
    setLoading(true);
    try {
      const found = (await listFarms(firebaseUser.uid)).find(item => item.id === farmId) ?? null;
      setFarm(found);
      if (found) {
        setName(found.name);
        setLocation(found.location ?? '');
        setLatitude(found.latitude);
        setLongitude(found.longitude);
        setSize(found.size == null ? '' : String(found.size));
        setSizeUnit(found.sizeUnit ?? '');
        setFarmType(found.farmType ?? '');
        setDescription(found.description ?? '');
      }
    } catch {
      setFarm(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [firebaseUser?.uid, farmId]);

  async function save() {
    if (!firebaseUser || !farmId || !name.trim()) return;
    setSaving(true);
    try {
      await updateFarm(firebaseUser.uid, farmId, {
        name: name.trim(),
        location: location.trim() || undefined,
        latitude,
        longitude,
        size: size.trim() ? Number(size) : undefined,
        sizeUnit: sizeUnit.trim() || undefined,
        farmType: farmType || undefined,
        description: description.trim() || undefined,
      });
      await load();
      Alert.alert('Farm saved', 'Your farm details have been updated.');
    } catch (error) {
      Alert.alert('Could not save farm', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function remove() {
    if (!firebaseUser || !farmId) return;
    Alert.alert(
      'Delete farm?',
      'The farm can only be deleted when it has no animals, crops, health records, tasks, feeding plans, marketplace listings, or diagnoses. This prevents accidental loss or orphaning of farm history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFarm(firebaseUser.uid, farmId);
              router.back();
            } catch (error) {
              Alert.alert('Farm not empty', error instanceof Error ? error.message : 'Remove the farm records first, then try again.');
            }
          },
        },
      ],
    );
  }

  if (loading) return <AppScreen><AppText variant="largeTitle">Loading farm…</AppText></AppScreen>;
  if (!farm) return <AppScreen><AppText variant="largeTitle">Farm not found</AppText><AppButton title="Back" variant="secondary" onPress={() => router.back()} /></AppScreen>;

  return (
    <AppScreen>
      <AppText variant="caption">Farm workspace</AppText>
      <AppText variant="largeTitle">{farm.name}</AppText>
      <AppText style={styles.subtitle}>Manage the farm identity and location used by the rest of your workspace.</AppText>

      <TextInput value={name} onChangeText={setName} placeholder="Farm name" placeholderTextColor={colors.textTertiary} style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]} />
      <OptionPicker label="Farm type" options={FARM_TYPES} selected={FARM_TYPES.find(option => option.label === farmType)?.id ?? ''} onChange={id => setFarmType(FARM_TYPES.find(option => option.id === id)?.label ?? '')} />
      <LocationPicker label="Farm location" value={location} onSelect={next => { setLocation(next.label); setLatitude(next.latitude); setLongitude(next.longitude); }} />
      <View style={styles.row}>
        <TextInput value={size} onChangeText={setSize} keyboardType="decimal-pad" placeholder="Farm size" placeholderTextColor={colors.textTertiary} style={[styles.input, styles.grow, { color: colors.textPrimary, borderColor: colors.border }]} />
        <TextInput value={sizeUnit} onChangeText={setSizeUnit} placeholder="Unit" placeholderTextColor={colors.textTertiary} style={[styles.input, styles.grow, { color: colors.textPrimary, borderColor: colors.border }]} />
      </View>
      <TextInput value={description} onChangeText={setDescription} multiline placeholder="Description" placeholderTextColor={colors.textTertiary} style={[styles.input, styles.description, { color: colors.textPrimary, borderColor: colors.border }]} />

      <AppButton title="Save farm" loading={saving} disabled={!name.trim()} onPress={save} />
      <AppButton title="Delete farm" variant="secondary" onPress={remove} />
      <AppButton title="Back to farm workspace" variant="secondary" onPress={() => router.back()} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: { opacity: 0.7, marginBottom: Spacing.lg },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.md, fontSize: 16 },
  row: { flexDirection: 'row', gap: Spacing.md },
  grow: { flex: 1 },
  description: { minHeight: 100, textAlignVertical: 'top', paddingTop: Spacing.md },
});
