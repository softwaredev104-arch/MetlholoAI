import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const Typography = {
  largeTitle: { fontFamily, fontSize: 32, fontWeight: '700', lineHeight: 40 },
  title1: { fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 36 },
  title2: { fontFamily, fontSize: 24, fontWeight: '600', lineHeight: 32 },
  title3: { fontFamily, fontSize: 20, fontWeight: '600', lineHeight: 28 },
  headline: { fontFamily, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  body: { fontFamily, fontSize: 16, fontWeight: '400', lineHeight: 24 },
  callout: { fontFamily, fontSize: 14, fontWeight: '500', lineHeight: 21 },
  subheadline: { fontFamily, fontSize: 14, fontWeight: '400', lineHeight: 21 },
  footnote: { fontFamily, fontSize: 12, fontWeight: '400', lineHeight: 18 },
  caption: { fontFamily, fontSize: 11, fontWeight: '500', lineHeight: 16 },
  caption2: { fontFamily, fontSize: 10, fontWeight: '600', lineHeight: 14 },
} satisfies Record<string, TextStyle>;
