import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { MarketPrice } from '@/services/knowledge/models';
import { SourceBadge } from './SourceBadge';

export function MarketPriceCard({ price }: { price: MarketPrice }) {
  return <AppCard>
    <AppText variant="headline">{price.commodity}</AppText>
    {price.grade !== undefined ? <AppText>Grade {price.grade}</AppText> : null}
    {price.perBagPrice !== undefined ? <AppText>{price.currency} {price.perBagPrice.toFixed(2)} / bag</AppText> : null}
    {price.perMtPrice !== undefined ? <AppText>{price.currency} {price.perMtPrice.toFixed(2)} / MT</AppText> : null}
    <AppText style={{ opacity: 0.7 }}>{price.priceType.replace('_', ' ')}</AppText>
    <SourceBadge source={price.source} />
  </AppCard>;
}
