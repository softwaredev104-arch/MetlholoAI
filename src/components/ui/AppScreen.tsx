import { PropsWithChildren } from 'react';
import {
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

type Props = PropsWithChildren<
  ScrollViewProps & {
    scroll?: boolean;
    maxWidth?: number;
  }
>;

export function AppScreen({
  children,
  scroll = true,
  maxWidth = 1180,
  contentContainerStyle,
  ...props
}: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const horizontalPadding =
    width < 480 ? Spacing.md : width < 768 ? Spacing.lg : Spacing.xl;

  const responsiveFrame: ViewStyle = {
    width: '100%',
    maxWidth,
    alignSelf: 'center',
    paddingHorizontal: horizontalPadding,
    paddingVertical: width < 480 ? Spacing.md : Spacing.lg,
  };

  const responsiveContentStyle = [
    styles.content,
    responsiveFrame,
    contentContainerStyle,
  ];

  const content = scroll ? (
    <ScrollView
      {...props}
      keyboardShouldPersistTaps={props.keyboardShouldPersistTaps ?? 'handled'}
      contentContainerStyle={responsiveContentStyle}
      style={styles.scroll}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={responsiveContentStyle}>{children}</View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={Platform.OS === 'web' ? ['top', 'bottom'] : undefined}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    gap: Spacing.lg,
    flexGrow: 1,
  },
});
