import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { IntelligenceCard } from '@/components/intelligence/IntelligenceCard';
import { ModelTray } from '@/components/intelligence/ModelTray';
import { getModels, getModelsForSubject, type IntelligenceCategory, type IntelligenceModel } from '@/services/intelligence/catalog';
import { Spacing } from '@/design/spacing';

export default function IntelligenceExplorer() {
  const [category, setCategory] = useState<IntelligenceCategory>('crops');
  const [subject, setSubject] = useState<string | null>(null);
  const [selected, setSelected] = useState<IntelligenceModel | null>(null);
  const subjects = useMemo(() => Array.from(new Set(getModels(category).map(model => model.subject))), [category]);

  return (
    <AppScreen>
      <AppText variant="largeTitle">Explore intelligence</AppText>
      <AppText style={styles.muted}>Choose what you want MetlholoAI to diagnose.</AppText>

      <View style={styles.tabs}>
        {(['crops', 'livestock'] as IntelligenceCategory[]).map(item => (
          <AppText key={item} onPress={() => { setCategory(item); setSubject(null); }} style={item === category ? styles.activeTab : styles.tab}>
            {item === 'crops' ? 'Crops' : 'Livestock'}
          </AppText>
        ))}
      </View>

      <View style={styles.grid}>
        {subjects.map(item => (
          <IntelligenceCard
            key={item}
            subject={item}
            count={getModelsForSubject(item).length}
            icon={category === 'crops' ? 'leaf-outline' : 'paw-outline'}
            onPress={() => setSubject(item)}
          />
        ))}
      </View>

      <ModelTray
        visible={Boolean(subject)}
        subject={subject ?? ''}
        models={subject ? getModelsForSubject(subject) : []}
        onClose={() => setSubject(null)}
        onSelect={model => { setSelected(model); setSubject(null); router.push({ pathname: '/model-guide', params: { modelId: model.id } }); }}
      />

      {selected ? (
        <View style={styles.selected}>
          <AppText variant="headline">Selected: {selected.name}</AppText>
          <AppText style={styles.muted}>Open the scan guide to prepare the image for this model.</AppText>
          <AppText onPress={() => setSelected(null)} style={styles.link}>Choose another model</AppText>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  muted: { opacity: 0.7 },
  tabs: { flexDirection: 'row', gap: Spacing.xl },
  tab: { opacity: 0.55, paddingVertical: Spacing.sm },
  activeTab: { fontWeight: '700', paddingVertical: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  selected: { gap: Spacing.sm, marginTop: Spacing.md },
  link: { fontWeight: '700' },
});
