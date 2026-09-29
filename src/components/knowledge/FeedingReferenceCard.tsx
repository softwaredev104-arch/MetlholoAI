import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { AgriculturalProduct } from '@/services/knowledge/models';
import { SourceBadge } from './SourceBadge';

export function FeedingReferenceCard({ product }: { product: AgriculturalProduct }) {
  return <AppCard>
    <AppText variant="headline">{product.productName}</AppText>
    <AppText>{product.targetSpecies ? `For: ${product.targetSpecies}` : 'Animal feed reference'}</AppText>
    {product.purpose ? <AppText>{product.purpose}</AppText> : null}
    <SourceBadge source={product.source} />
  </AppCard>;
}
