import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';
import { ModelRow } from './IntelligenceCard';
import type { IntelligenceModel } from '@/services/intelligence/catalog';

export function ModelTray({ subject, models, visible, onClose, onSelect }: { subject: string; models: IntelligenceModel[]; visible: boolean; onClose: () => void; onSelect: (model: IntelligenceModel) => void }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={event => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <AppText variant="largeTitle">{subject}</AppText>
              <AppText style={{ color: colors.textSecondary }}>{models.length} available models</AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close models" onPress={onClose}>
              <Ionicons name="close-circle" size={30} color={colors.textTertiary} />
            </Pressable>
          </View>
          <AppCard>
            {models.map(model => <ModelRow key={model.id} model={model} onPress={() => onSelect(model)} />)}
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { maxHeight: '82%', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.lg, gap: Spacing.md },
  handle: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: '#9CA3AF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
