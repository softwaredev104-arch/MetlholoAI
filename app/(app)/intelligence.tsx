import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { IntelligenceCard } from '@/components/intelligence/IntelligenceCard';
import { ModelTray } from '@/components/intelligence/ModelTray';
import { getModels, getModelsForSubject, type IntelligenceCategory, type IntelligenceModel } from '@/services/intelligence/catalog';
import { Spacing } from '@/design/spacing';
import { useTheme } from '@/design/themes';

const categories: { id: IntelligenceCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'crops', label: 'Crops', icon: 'leaf-outline' },
  { id: 'livestock', label: 'Livestock', icon: 'paw-outline' },
];

export default function IntelligenceExplorer() {
  const { colors } = useTheme();
  const [category, setCategory] = useState<IntelligenceCategory>('crops');
  const [subject, setSubject] = useState<string | null>(null);

  const subjects = useMemo(
    () => Array.from(new Set(getModels(category).map(model => model.subject))),
    [category],
  );

  const selectModel = (model: IntelligenceModel) => {
    router.push({ pathname: '/model-guide', params: { modelId: model.id } });
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <AppText variant="largeTitle">Explore</AppText>
          <AppText style={{ color: colors.textSecondary }}>
            Choose a crop or animal, then select the intelligence model you want to use.
          </AppText>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.primarySubtle }]}>
          <Ionicons name="sparkles" size={24} color={colors.primary} />
        </View>
      </View>

      <View style={[styles.segmented, { backgroundColor: colors.surfaceSecondary }]}>
        {categories.map(item => {
          const active = item.id === category;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => { setCategory(item.id); setSubject(null); }}
              style={[styles.segment, active && { backgroundColor: colors.surface }]}
            >
              <Ionicons name={item.icon} size={17} color={active ? colors.primary : colors.textSecondary} />
              <AppText style={{ color: active ? colors.textPrimary : colors.textSecondary, fontWeight: active ? '700' : '500' }}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        {subjects.map(item => (
          <IntelligenceCard
            key={item}
            subject={item}
            count={getModelsForSubject(item).filter(model => model.category === category).length}
            category={category}
            onPress={() => setSubject(item)}
          />
        ))}
      </View>

      {!subjects.length ? (
        <View style={styles.empty}>
          <Ionicons name="construct-outline" size={30} color={colors.textTertiary} />
          <AppText variant="headline">No models configured yet</AppText>
          <AppText style={{ color: colors.textSecondary, textAlign: 'center' }}>
            This category will appear here when its inference service is connected.
          </AppText>
        </View>
      ) : null}

      <ModelTray
        visible={Boolean(subject)}
        subject={subject ?? ''}
        models={subject ? getModelsForSubject(subject).filter(model => model.category === category) : []}
        onClose={() => setSubject(null)}
        onSelect={selectModel}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
});
