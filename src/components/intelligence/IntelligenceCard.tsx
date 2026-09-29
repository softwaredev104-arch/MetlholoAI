import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';
import type { IntelligenceCategory, IntelligenceModel } from '@/services/intelligence/catalog';

const subjectIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Maize: 'leaf',
  Tomato: 'nutrition-outline',
  Spinach: 'leaf-outline',
  Pepper: 'flame-outline',
  Potatoes: 'ellipse-outline',
  Grape: 'wine-outline',
  Cattle: 'paw',
  Chicken: 'egg-outline',
};

export function IntelligenceCard({ subject, count, category, onPress }: { subject: string; count: number; category: IntelligenceCategory; onPress: () => void }) {
  const { colors } = useTheme();
  const icon = subjectIcons[subject] ?? (category === 'crops' ? 'leaf-outline' : 'paw-outline');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${subject}, ${count} models`} onPress={onPress} style={({ pressed }) => [styles.wrapper, { opacity: pressed ? 0.78 : 1 }]}>
      <AppCard style={styles.card}>
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.primarySubtle }]}>
          <Ionicons name={icon} size={38} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <AppText variant="headline">{subject}</AppText>
          <AppText style={{ color: colors.textSecondary }}>{count} {count === 1 ? 'model' : 'models'}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </AppCard>
    </Pressable>
  );
}

export function ModelRow({ model, onPress }: { model: IntelligenceModel; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.row, { borderBottomColor: colors.divider }]}>
      <View style={styles.modelIcon}>
        <Ionicons name={model.category === 'crops' ? 'leaf-outline' : 'paw-outline'} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="headline">{model.name}</AppText>
        <AppText style={{ color: colors.textSecondary }}>{model.disease ?? 'Image intelligence model'}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '47%' },
  card: { minHeight: 205, padding: Spacing.md, gap: Spacing.sm },
  imagePlaceholder: { height: 112, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  modelIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
});
