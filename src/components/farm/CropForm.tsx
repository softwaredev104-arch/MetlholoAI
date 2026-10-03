import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { ChoiceChip } from '@/components/app/ProductUI';
import type { CropFieldRecord } from '@/services/farms/domainRepository';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

const crops = ['Maize', 'Sorghum', 'Tomato', 'Potato', 'Groundnuts', 'Beans', 'Millet', 'Cassava', 'Spinach', 'Pepper', 'Grape', 'Wheat'];
const stages = ['Germination', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest', 'Dormant'];
const health = ['Excellent', 'Good', 'Fair', 'Poor'];
const irrigation = ['Drip', 'Flood', 'Sprinkler', 'Centre Pivot', 'Furrow', 'Rain-fed'];
const soils = ['Sandy Loam', 'Loam', 'Clay', 'Clay Loam', 'Sandy', 'Silty Clay'];

export type CropFormValue = {
  name: string;
  cropType: string;
  variety: string;
  areaHectares?: number;
  location: string;
  growthStage: string;
  healthStatus: string;
  irrigationType: string;
  soilType: string;
  plantedDate: string;
  harvestDate: string;
  lastInspection: string;
  notes: string;
  status: string;
};

export function CropForm({
  initial,
  submitLabel = 'Save Field',
  loading = false,
  onSubmit,
}: {
  initial?: Partial<CropFieldRecord>;
  submitLabel?: string;
  loading?: boolean;
  onSubmit: (value: CropFormValue) => Promise<void> | void;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState(String(initial?.name ?? ''));
  const [cropType, setCropType] = useState(String(initial?.cropType ?? 'Maize'));
  const [variety, setVariety] = useState(String(initial?.variety ?? ''));
  const [area, setArea] = useState(
    initial?.areaHectares !== undefined ? String(initial.areaHectares) : '',
  );
  const [location, setLocation] = useState(String(initial?.location ?? ''));
  const [growthStage, setGrowthStage] = useState(String(initial?.growthStage ?? 'Germination'));
  const [healthStatus, setHealthStatus] = useState(String(initial?.healthStatus ?? 'Good'));
  const [irrigationType, setIrrigationType] = useState(String(initial?.irrigationType ?? 'Rain-fed'));
  const [soilType, setSoilType] = useState(String(initial?.soilType ?? 'Sandy Loam'));
  const [plantedDate, setPlantedDate] = useState(String(initial?.plantedDate ?? ''));
  const [harvestDate, setHarvestDate] = useState(String(initial?.harvestDate ?? ''));
  const [lastInspection, setLastInspection] = useState(String(initial?.lastInspection ?? ''));
  const [notes, setNotes] = useState(String(initial?.notes ?? ''));
  const [error, setError] = useState('');

  async function submit() {
    if (name.trim().length < 2) {
      setError('Enter a field name.');
      return;
    }
    setError('');
    await onSubmit({
      name: name.trim(),
      cropType,
      variety: variety.trim(),
      areaHectares: area.trim() ? Number(area) : undefined,
      location: location.trim(),
      growthStage,
      healthStatus,
      irrigationType,
      soilType,
      plantedDate: plantedDate.trim(),
      harvestDate: harvestDate.trim(),
      lastInspection: lastInspection.trim(),
      notes: notes.trim(),
      status: healthStatus.toLowerCase(),
    });
  }

  const group = (title: string, values: string[], selected: string, setSelected: (value: string) => void) => (
    <View style={styles.section}>
      <AppText variant="headline">{title}</AppText>
      <View style={styles.chips}>
        {values.map(item => (
          <ChoiceChip
            key={item}
            label={item}
            selected={selected === item}
            onPress={() => setSelected(item)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.form}>
      {group('Crop type', crops, cropType, setCropType)}
      <AppTextField label="Field name" value={name} onChangeText={setName} placeholder="e.g. North Maize Field" />

      <View style={styles.row}>
        <View style={styles.grow}>
          <AppTextField label="Variety" value={variety} onChangeText={setVariety} placeholder="e.g. SC403" />
        </View>
        <View style={styles.grow}>
          <AppTextField
            label="Field size (ha)"
            value={area}
            onChangeText={setArea}
            placeholder="e.g. 3.5"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <AppTextField label="Location / plot" value={location} onChangeText={setLocation} placeholder="e.g. North Block, Plot 4" />
      {group('Growth stage', stages, growthStage, setGrowthStage)}
      {group('Health status', health, healthStatus, setHealthStatus)}
      {group('Irrigation type', irrigation, irrigationType, setIrrigationType)}
      {group('Soil type', soils, soilType, setSoilType)}

      <View style={styles.row}>
        <View style={styles.grow}>
          <AppTextField label="Planted date" value={plantedDate} onChangeText={setPlantedDate} placeholder="YYYY-MM-DD" />
        </View>
        <View style={styles.grow}>
          <AppTextField label="Harvest estimate" value={harvestDate} onChangeText={setHarvestDate} placeholder="YYYY-MM-DD" />
        </View>
      </View>

      <AppTextField label="Last inspection" value={lastInspection} onChangeText={setLastInspection} placeholder="YYYY-MM-DD" />
      <AppTextField label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={4} placeholder="Field notes, observations, issues..." />

      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}
      <AppButton title={submitLabel} icon="checkmark" onPress={submit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.lg },
  section: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  grow: { minWidth: 220, flex: 1 },
});
