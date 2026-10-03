import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/design/themes';
import { Radii } from '@/design/radii';
import { Shadows } from '@/design/shadows';
import { Spacing } from '@/design/spacing';

type Props = PropsWithChildren<ViewProps & { onPress?: () => void }>;

export function AppCard({ children, style, onPress, ...props }: Props) {
  const { colors } = useTheme();
  const baseStyle = [
    styles.card,
    Shadows.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        {...props}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [baseStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View {...props} style={baseStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.995 }] },
});
