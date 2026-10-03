import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type FeedingPlan,
} from '@/services/farms/domainRepository';
import { SectionHeader, StatusPill } from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function FeedingPlans() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [records, setRecords] = useState<FeedingPlan[]>([]);

  useEffect(() => {
    if (!user || !farm) return;
    farmDomain.feeding.list(user.uid, farm.id).then(setRecords);
  }, [user?.uid, farm?.id]);

  return (
    <AppScreen>
      <SectionHeader
        title="Feeding Plans"
        subtitle={String(records.length) + ' active plans'}
        action={
          <AppButton
            title="Add Plan"
            icon="add"
            onPress={() => router.push('/(app)/feeding-plan/new' as any)}
          />
        }
      />

      {records.length === 0 ? (
        <AppCard>
          <AppText variant="headline">No feeding plans yet</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Create daily feeding plans linked to registered animals.
          </AppText>
        </AppCard>
      ) : (
        records.map(plan => (
          <AppCard key={plan.id}>
            <View style={styles.top}>
              <View style={{ flex: 1 }}>
                <AppText variant="title3">{plan.animalName || plan.name}</AppText>
                <AppText style={{ color: colors.textSecondary }}>
                  {[plan.species, plan.feedType].filter(Boolean).join(' · ')}
                </AppText>
              </View>
              {plan.costPerDay !== undefined ? (
                <StatusPill label={'P ' + String(plan.costPerDay) + '/day'} tone="info" />
              ) : null}
            </View>
            <View style={styles.meta}>
              {plan.amount ? <StatusPill label={plan.amount} /> : null}
              {plan.frequency ? <StatusPill label={plan.frequency} /> : null}
              {plan.supplement ? <StatusPill label={plan.supplement} /> : null}
            </View>
            {plan.notes ? (
              <AppText variant="footnote" style={{ color: colors.textSecondary }}>
                {plan.notes}
              </AppText>
            ) : null}
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
