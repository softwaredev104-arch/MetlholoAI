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
  type FarmTask,
} from '@/services/farms/domainRepository';
import {
  ChoiceChip,
  SectionHeader,
  StatusPill,
} from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

export default function Tasks() {
  const { user, farm } = usePrimaryFarm();
  const { colors } = useTheme();
  const [records, setRecords] = useState<FarmTask[]>([]);

  async function load() {
    if (!user || !farm) return;
    setRecords(await farmDomain.tasks.list(user.uid, farm.id));
  }

  useEffect(() => {
    void load();
  }, [user?.uid, farm?.id]);

  const done = records.filter(item => item.status === 'done').length;
  const pending = records.length - done;
  const progress = records.length ? Math.round((done / records.length) * 100) : 0;

  async function toggle(item: FarmTask) {
    if (!user || !farm) return;
    await farmDomain.tasks.update(user.uid, farm.id, item.id, {
      status: item.status === 'done' ? 'pending' : 'done',
    });
    await load();
  }

  return (
    <AppScreen>
      <SectionHeader
        title="Farm Tasks"
        subtitle={String(pending) + ' pending · ' + String(done) + ' done'}
        action={
          <AppButton
            title="New Task"
            icon="add"
            onPress={() => router.push('/(app)/task/new' as any)}
          />
        }
      />

      <AppCard>
        <AppText variant="headline">Today's progress</AppText>
        <AppText variant="title1">{String(progress)}% complete</AppText>
        <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
          <View
            style={[
              styles.progress,
              { backgroundColor: colors.primary, width: String(progress) + '%' },
            ]}
          />
        </View>
      </AppCard>

      {records.length === 0 ? (
        <AppCard>
          <AppText variant="headline">No farm tasks yet</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Add feeding, health, harvest, irrigation, spraying or general tasks.
          </AppText>
        </AppCard>
      ) : (
        records.map(task => (
          <AppCard key={task.id}>
            <View style={styles.top}>
              <ChoiceChip
                label={task.status === 'done' ? 'Done' : 'Mark done'}
                selected={task.status === 'done'}
                onPress={() => toggle(task)}
                icon="checkmark-circle-outline"
              />
              <View style={{ flex: 1 }}>
                <AppText
                  variant="headline"
                  style={
                    task.status === 'done'
                      ? { textDecorationLine: 'line-through', color: colors.textTertiary }
                      : undefined
                  }
                >
                  {task.name}
                </AppText>
                {task.notes ? (
                  <AppText style={{ color: colors.textSecondary }}>{task.notes}</AppText>
                ) : null}
              </View>
            </View>
            <View style={styles.meta}>
              {task.category ? <StatusPill label={task.category} tone="info" /> : null}
              {task.priority ? (
                <StatusPill
                  label={task.priority}
                  tone={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'neutral'}
                />
              ) : null}
              {task.dueDate ? <StatusPill label={task.dueDate} /> : null}
              {task.relatedTo ? <StatusPill label={task.relatedTo} /> : null}
            </View>
          </AppCard>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progress: { height: '100%', borderRadius: 999 },
});
