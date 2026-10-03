import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type CropFieldRecord,
} from '@/services/farms/domainRepository';
import { IconLabel, StatusPill } from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function CropDetail() {
  const { cropId } = useLocalSearchParams<{ cropId: string }>();
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [field, setField] = useState<CropFieldRecord | null>(null);

  useEffect(() => {
    if (!user || !farm || !cropId) return;
    farmDomain.crops.list(user.uid, farm.id).then(items => {
      setField(items.find(item => item.id === cropId) ?? null);
    });
  }, [user?.uid, farm?.id, cropId]);

  if (!field) {
    return (
      <AppScreen>
        <AppText variant="largeTitle">Field</AppText>
        <AppText>Loading field record…</AppText>
      </AppScreen>
    );
  }

  return (
    <AppScreen maxWidth={900}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: colors.primarySubtle }]}>
          <Ionicons name="leaf" size={40} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="largeTitle">{field.name}</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            {[field.cropType, field.variety].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <StatusPill label={field.growthStage || 'Not staged'} tone="info" />
      </View>

      <AppCard>
        <AppText variant="title2">Field Details</AppText>
        <View style={styles.infoGrid}>
          <IconLabel
            icon="resize-outline"
            label="Field size"
            value={field.areaHectares ? String(field.areaHectares) + ' ha' : 'Not set'}
          />
          <IconLabel icon="location-outline" label="Location" value={field.location || 'Not set'} />
          <IconLabel icon="water-outline" label="Irrigation" value={field.irrigationType || 'Not set'} />
          <IconLabel icon="layers-outline" label="Soil type" value={field.soilType || 'Not set'} />
          <IconLabel icon="calendar-outline" label="Planted" value={field.plantedDate || 'Not set'} />
          <IconLabel icon="calendar-number-outline" label="Harvest est." value={field.harvestDate || 'Not set'} />
        </View>
      </AppCard>

      <AppCard>
        <AppText variant="title2">Field Health</AppText>
        <View style={styles.pills}>
          <StatusPill
            label={field.healthStatus || 'Not assessed'}
            tone={field.healthStatus === 'Poor' ? 'error' : field.healthStatus === 'Fair' ? 'warning' : 'success'}
          />
          {field.lastInspection ? <StatusPill label={'Inspected ' + field.lastInspection} /> : null}
        </View>
        <AppText style={{ color: colors.textSecondary }}>
          {field.notes || 'No field notes have been added.'}
        </AppText>
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          title="Create Case Record"
          icon="document-text-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/case/new' as any,
              params: { cropId: field.id, cropName: field.name },
            })
          }
        />
        <AppButton
          title="Edit Crop Details"
          variant="secondary"
          icon="create-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/crop/[cropId]/edit' as any,
              params: { cropId: field.id },
            })
          }
        />
        <AppButton
          title="Scan This Crop"
          icon="scan-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/scan' as any,
              params: { sourceRecordType: 'crops', sourceRecordId: field.id, sourceName: field.name },
            })
          }
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actions: { gap: Spacing.sm },
});
