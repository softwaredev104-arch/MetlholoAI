import { Redirect, useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import type { FarmRecordType } from '@/services/farms/farmRepository';

const routes: Partial<Record<FarmRecordType, string>> = {
  animals: '/(app)/(tabs)/animals',
  crops: '/(app)/crops',
  healthRecords: '/(app)/health-records',
  tasks: '/(app)/tasks',
  feedingPlans: '/(app)/feeding-plans',
  marketplace: '/(app)/market-prices',
};

export default function LegacyFarmRecordRoute() {
  const { type } = useLocalSearchParams<{ type?: FarmRecordType }>();
  const target = type ? routes[type] : undefined;

  if (target) return <Redirect href={target as any} />;

  return (
    <AppScreen>
      <AppText variant="largeTitle">Farm workspace</AppText>
      <AppText>This legacy route no longer maps to a farm module.</AppText>
    </AppScreen>
  );
}
