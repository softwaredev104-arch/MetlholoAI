import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';
import type { IntelligenceModel } from '@/services/intelligence/catalog';

export function IntelligenceCard({ subject, count, icon, onPress }: { subject: string; count: number; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${subject}, ${count} models`} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
      <AppCard style={styles.card}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name={icon} size={30} color={colors.primary} />
        </View>
        <AppText variant="headline">{subject}</AppText>
        <AppText style={{ color: colors.textSecondary }}>{count} models</AppText>
      </AppCard>
    </Pressable>
  );
}

export function ModelRow({ model, onPress }: { model: IntelligenceModel; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.row, { borderBottomColor: colors.divider }]}>
      <View style={{ flex: 1 }}>
        <AppText variant="headline">{model.name}</AppText>
        <AppText style={{ color: colors.textSecondary }}>{model.subject}{model.disease ? ` · ${model.disease}` : ''}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 160, gap: Spacing.sm },
  icon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
});
