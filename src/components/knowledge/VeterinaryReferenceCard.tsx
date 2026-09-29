import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { AgriculturalProduct } from '@/services/knowledge/models';
import { SourceBadge } from './SourceBadge';

export function VeterinaryReferenceCard({ product }: { product: AgriculturalProduct }) {
  return <AppCard>
    <AppText variant="headline">{product.productName}</AppText>
    <AppText>Veterinary reference · {product.category.replace('_', ' ')}</AppText>
    {product.targetSpecies ? <AppText>Species: {product.targetSpecies}</AppText> : null}
    {product.purpose ? <AppText>{product.purpose}</AppText> : null}
    <AppText style={{ opacity: 0.7 }}>Reference information only; treatment decisions require appropriate professional guidance.</AppText>
    <SourceBadge source={product.source} />
  </AppCard>;
}
