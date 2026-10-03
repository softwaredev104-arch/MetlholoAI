import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';
import {
  listPublishedMarketPrices,
} from '@/services/knowledge/knowledgeRepository';
import type { MarketPrice } from '@/services/knowledge/models';
import { SectionHeader, StatusPill } from '@/components/app/ProductUI';
import { useTheme } from '@/design/themes';
import { Spacing } from '@/design/spacing';

function iconFor(commodity: string) {
  const value = commodity.toLowerCase();
  if (value.includes('cattle')) return 'paw-outline';
  if (value.includes('fertilizer')) return 'flask-outline';
  return 'leaf-outline';
}

export default function MarketPrices() {
  const { colors } = useTheme();
  const [prices, setPrices] = useState<MarketPrice[]>([]);

  useEffect(() => {
    listPublishedMarketPrices().then(setPrices);
  }, []);

  return (
    <AppScreen>
      <SectionHeader
        title="Market Prices"
        subtitle="Botswana · reference dashboard"
      />

      <AppCard style={{ backgroundColor: colors.accentSubtle }}>
        <StatusPill label="Reference data" tone="warning" />
        <AppText variant="headline">Price feed not connected yet</AppText>
        <AppText style={{ color: colors.textSecondary }}>
          These values come from the supplied design specification and are shown only to validate the product flow. They are not presented as current market prices.
        </AppText>
      </AppCard>

      {prices.map(price => (
        <AppCard key={price.id}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name={iconFor(price.commodity) as any} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="title3">{price.commodity}</AppText>
              <AppText variant="footnote" style={{ color: colors.textSecondary }}>
                Botswana reference
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="title2">
                {price.perMtPrice !== undefined
                  ? 'P ' + price.perMtPrice.toLocaleString() + ' / tonne'
                  : price.perBagPrice !== undefined
                    ? 'P ' + price.perBagPrice.toLocaleString()
                    : 'No price'}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textTertiary }}>
                {price.source.source}
              </AppText>
            </View>
          </View>
        </AppCard>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
