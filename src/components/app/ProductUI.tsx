import { PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/design/themes';
import { Radii } from '@/design/radii';
import { Spacing } from '@/design/spacing';

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="title2">{title}</AppText>
        {subtitle ? (
          <AppText variant="subheadline" style={{ color: colors.textSecondary }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
}) {
  const { colors } = useTheme();
  const palette = {
    neutral: { bg: colors.surfaceSecondary, fg: colors.textSecondary },
    success: { bg: colors.success + '18', fg: colors.success },
    warning: { bg: colors.warning + '18', fg: colors.warning },
    error: { bg: colors.error + '18', fg: colors.error },
    info: { bg: colors.info + '18', fg: colors.info },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <AppText variant="caption" style={{ color: palette.fg }}>
        {label}
      </AppText>
    </View>
  );
}

export function ChoiceChip({
  label,
  selected = false,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.choice,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={17}
          color={selected ? '#FFFFFF' : colors.primary}
        />
      ) : null}
      <AppText
        variant="callout"
        style={{ color: selected ? '#FFFFFF' : colors.textPrimary }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'accent' | 'success' | 'warning';
}) {
  const { colors } = useTheme();
  const color =
    tone === 'accent'
      ? colors.accent
      : tone === 'success'
        ? colors.success
        : tone === 'warning'
          ? colors.warning
          : colors.primary;

  return (
    <AppCard style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <AppText variant="title1">{String(value)}</AppText>
      <AppText variant="caption" style={{ color: colors.textSecondary }}>
        {label}
      </AppText>
    </AppCard>
  );
}

export function ResponsiveGrid({
  children,
  minCardWidth = 220,
  style,
}: PropsWithChildren<{ minCardWidth?: number; style?: ViewStyle }>) {
  const { width } = useWindowDimensions();
  const columns =
    width >= 1180 ? 4 : width >= 850 ? 3 : width >= 560 ? 2 : 1;

  const childArray = Array.isArray(children) ? children : [children];

  return (
    <View style={[styles.grid, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{
            width: columns === 1 ? '100%' : String(Math.floor(100 / columns) - 1) + '%',
            minWidth: Math.min(minCardWidth, width - 40),
            flexGrow: 1,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

export function IconLabel({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.iconLabel}>
      <View style={[styles.smallIcon, { backgroundColor: colors.primarySubtle }]}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="caption" style={{ color: colors.textTertiary }}>
          {label}
        </AppText>
        <AppText variant="callout">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  choice: {
    minHeight: 42,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metric: { minHeight: 132, justifyContent: 'space-between' },
  metricIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    alignItems: 'stretch',
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  smallIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
