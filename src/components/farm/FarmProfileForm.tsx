import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { ChoiceChip } from '@/components/app/ProductUI';
import type { Farm } from '@/services/farms/farmRepository';
import type { FarmType, FarmSizeBand } from '@/types/user';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

export type FarmProfileValue = {
  name: string;
  farmType: FarmType;
  farmSizeBand: FarmSizeBand;
  location?: string;
  latitude?: number;
  longitude?: number;
};

const farmTypes: Array<[FarmType, string]> = [
  ['CROPS', 'Crop farm'],
  ['LIVESTOCK', 'Livestock farm'],
  ['MIXED', 'Mixed farm'],
];

const sizeBands: Array<[FarmSizeBand, string]> = [
  ['SMALL', 'Small · 1–5 ha'],
  ['MEDIUM', 'Medium · 5–20 ha'],
  ['LARGE', 'Large · 20+ ha'],
];

export function FarmProfileForm({
  initial,
  submitLabel,
  loading,
  onSubmit,
}: {
  initial?: Partial<Farm>;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (value: FarmProfileValue) => Promise<void> | void;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [farmType, setFarmType] = useState<FarmType>(
    initial?.farmType ?? 'MIXED',
  );
  const [farmSizeBand, setFarmSizeBand] = useState<FarmSizeBand>(
    initial?.farmSizeBand ?? 'SMALL',
  );
  const [location, setLocation] = useState(initial?.location ?? '');
  const [latitude, setLatitude] = useState(initial?.latitude);
  const [longitude, setLongitude] = useState(initial?.longitude);
  const [error, setError] = useState('');

  async function submit() {
    if (name.trim().length < 2) {
      setError('Enter a farm name.');
      return;
    }
    setError('');
    await onSubmit({
      name: name.trim(),
      farmType,
      farmSizeBand,
      location: location.trim() || undefined,
      latitude,
      longitude,
    });
  }

  return (
    <View style={styles.form}>
      <AppTextField
        label="Farm Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Green Valley Estates"
      />

      <View style={styles.section}>
        <AppText variant="headline">Farm type</AppText>
        <View style={styles.chips}>
          {farmTypes.map(([value, label]) => (
            <ChoiceChip
              key={value}
              label={label}
              selected={farmType === value}
              onPress={() => setFarmType(value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="headline">Farm Size</AppText>
        <View style={styles.chips}>
          {sizeBands.map(([value, label]) => (
            <ChoiceChip
              key={value}
              label={label}
              selected={farmSizeBand === value}
              onPress={() => setFarmSizeBand(value)}
            />
          ))}
        </View>
      </View>

      <LocationPicker
        value={location}
        onSelect={next => {
          setLocation(next.label);
          setLatitude(next.latitude);
          setLongitude(next.longitude);
        }}
      />

      {latitude !== undefined && longitude !== undefined ? (
        <AppText variant="footnote" style={{ color: colors.textSecondary }}>
          Weather mapping active for this farm.
        </AppText>
      ) : (
        <AppText variant="footnote" style={{ color: colors.textSecondary }}>
          Select a search result to save weather coordinates for this farm.
        </AppText>
      )}

      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}

      <AppButton
        title={submitLabel}
        icon="checkmark"
        onPress={submit}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.lg },
  section: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
