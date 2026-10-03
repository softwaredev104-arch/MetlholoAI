import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppButton } from '@/components/ui/AppButton';
import { ChoiceChip, StatusPill } from '@/components/app/ProductUI';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import { createTreatment } from '@/services/treatments/treatmentRepository';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const methods = ['Oral', 'Injection', 'Topical', 'Feed', 'Water', 'Other'];
const frequencies = ['Once', '1x daily', '2x daily', '3x daily', 'Weekly'];

export default function NewTreatment() {
  const params = useLocalSearchParams<{
    caseId?: string;
    animalId?: string;
    animalName?: string;
  }>();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('1x daily');
  const [method, setMethod] = useState('Oral');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [followUp, setFollowUp] = useState(true);
  const [notifyVet, setNotifyVet] = useState(false);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!user || !farm) return;
    if (name.trim().length < 2) {
      setError('Enter a treatment name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createTreatment(user.uid, farm.id, {
        caseId: params.caseId || undefined,
        animalId: params.animalId || undefined,
        animalName: params.animalName || undefined,
        treatmentName: name.trim(),
        dosage: dosage.trim() || undefined,
        frequency,
        method,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
        followUp,
        notifyVet,
        cost: cost.trim() ? Number(cost) : undefined,
        notes: notes.trim() || undefined,
        status: 'active',
      });
      if (params.caseId) {
        router.replace({
          pathname: '/(app)/case/[caseId]' as any,
          params: { caseId: params.caseId },
        });
      } else {
        router.back();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen maxWidth={780}>
      <AppText variant="largeTitle">New Treatment</AppText>
      {params.animalName ? (
        <StatusPill label={'Linked to ' + params.animalName} tone="info" />
      ) : null}

      <AppTextField
        label="Treatment name"
        value={name}
        onChangeText={setName}
        placeholder="Medication, procedure or care plan"
      />
      <AppTextField
        label="Dosage"
        value={dosage}
        onChangeText={setDosage}
        placeholder="e.g. 10 ml"
      />

      <View style={styles.section}>
        <AppText variant="headline">Frequency</AppText>
        <View style={styles.chips}>
          {frequencies.map(item => (
            <ChoiceChip
              key={item}
              label={item}
              selected={frequency === item}
              onPress={() => setFrequency(item)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="headline">Method</AppText>
        <View style={styles.chips}>
          {methods.map(item => (
            <ChoiceChip
              key={item}
              label={item}
              selected={method === item}
              onPress={() => setMethod(item)}
            />
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.grow}>
          <AppTextField
            label="Start date"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.grow}>
          <AppTextField
            label="End date"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      <ChoiceChip
        label="Follow-up required"
        selected={followUp}
        onPress={() => setFollowUp(value => !value)}
        icon="calendar-outline"
      />
      <ChoiceChip
        label="Vet notification requested"
        selected={notifyVet}
        onPress={() => setNotifyVet(value => !value)}
        icon="notifications-outline"
      />

      <AppTextField
        label="Cost (BWP)"
        value={cost}
        onChangeText={setCost}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <AppTextField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        placeholder="Treatment notes..."
      />

      {notifyVet ? (
        <AppText style={{ color: colors.warning }}>
          Vet notification preference is recorded, but no veterinary messaging
          provider is connected yet.
        </AppText>
      ) : null}

      {error ? <AppText style={{ color: colors.error }}>{error}</AppText> : null}
      <AppButton
        title="Save Treatment"
        icon="checkmark"
        onPress={save}
        loading={loading}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  grow: { minWidth: 220, flex: 1 },
});
