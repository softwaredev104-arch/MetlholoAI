import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { usePrimaryFarm } from '@/hooks/usePrimaryFarm';
import {
  farmDomain,
  type HealthRecord,
} from '@/services/farms/domainRepository';
import {
  ChoiceChip,
  MetricCard,
  ResponsiveGrid,
  SectionHeader,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

const filters = ['All', 'Scheduled', 'Overdue', 'Done'];

function normalizeStatus(record: HealthRecord) {
  const status = String(record.status ?? '').toLowerCase();
  if (['done', 'completed', 'complete'].includes(status)) return 'Done';
  if (status === 'overdue') return 'Overdue';
  return 'Scheduled';
}

export default function HealthRecords() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [filter, setFilter] = useState('All');

  async function load() {
    if (!user || !farm) return;
    setRecords(await farmDomain.health.list(user.uid, farm.id));
  }

  useEffect(() => {
    void load();
  }, [user?.uid, farm?.id]);

  const stats = useMemo(() => ({
    scheduled: records.filter(item => normalizeStatus(item) === 'Scheduled').length,
    overdue: records.filter(item => normalizeStatus(item) === 'Overdue').length,
    done: records.filter(item => normalizeStatus(item) === 'Done').length,
  }), [records]);

  const visible = records.filter(
    item => filter === 'All' || normalizeStatus(item) === filter,
  );

  return (
    <AppScreen>
      <SectionHeader
        title="Health Records"
        subtitle="Vaccinations, treatments & checkups"
        action={
          <AppButton
            title="Add"
            icon="add"
            onPress={() => router.push('/(app)/health-record/new' as any)}
          />
        }
      />

      <ResponsiveGrid minCardWidth={170}>
        <MetricCard label="Scheduled" value={stats.scheduled} icon="calendar-outline" tone="primary" />
        <MetricCard label="Overdue" value={stats.overdue} icon="alert-circle-outline" tone="warning" />
        <MetricCard label="Done" value={stats.done} icon="checkmark-circle-outline" tone="success" />
      </ResponsiveGrid>

      <View style={styles.filters}>
        {filters.map(item => (
          <ChoiceChip
            key={item}
            label={item}
            selected={filter === item}
            onPress={() => setFilter(item)}
          />
        ))}
      </View>

      {visible.length === 0 ? (
        <AppCard>
          <AppText variant="headline">No health records in this view</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Add vaccinations, treatments, checkups or surgery records and track due dates.
          </AppText>
        </AppCard>
      ) : (
        visible.map(record => {
          const state = normalizeStatus(record);
          return (
            <AppCard key={record.id}>
              <View style={styles.top}>
                <View style={{ flex: 1 }}>
                  <AppText variant="headline">{record.description || record.name}</AppText>
                  <AppText style={{ color: colors.textSecondary }}>
                    {[record.relatedName, record.recordType].filter(Boolean).join(' · ')}
                  </AppText>
                </View>
                <StatusPill
                  label={state}
                  tone={state === 'Done' ? 'success' : state === 'Overdue' ? 'error' : 'info'}
                />
              </View>
              <View style={styles.meta}>
                {record.date ? <StatusPill label={record.date} /> : null}
                {record.officer ? <StatusPill label={record.officer} /> : null}
                {record.cost !== undefined ? <StatusPill label={'P ' + String(record.cost)} /> : null}
              </View>
            </AppCard>
          );
        })
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
