import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/design/themes';

type Props = Pick<PressableProps, 'onPress' | 'accessibilityState'>;

export function ScanTabButton({ onPress, accessibilityState }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Scan"
      accessibilityState={accessibilityState}
      onPress={onPress}
      style={[styles.button, { backgroundColor: colors.primary }]}
    >
      <Ionicons name="scan" size={28} color="#FFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    borderWidth: 4,
    borderColor: '#FFF',
  },
});
