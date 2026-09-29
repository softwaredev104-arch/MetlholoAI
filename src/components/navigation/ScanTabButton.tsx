import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/design/themes';

export function ScanTabButton({ onPress, accessibilityState }: { onPress?: () => void; accessibilityState?: { selected?: boolean } }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Scan" accessibilityState={accessibilityState} onPress={onPress} style={[styles.button, { backgroundColor: colors.primary }]}>
      <Ionicons name="scan" size={28} color="#FFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginTop: -24, borderWidth: 4, borderColor: '#FFF' },
});
