import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { AgriculturalProduct } from '@/services/knowledge/models';
import { SourceBadge } from './SourceBadge';

export function AgriculturalInputCard({ product }: { product: AgriculturalProduct }) {
  return <AppCard>
    <AppText variant="headline">{product.productName}</AppText>
    {product.brand ? <AppText>{product.brand}</AppText> : null}
    <AppText style={{ opacity: 0.75 }}>{product.category.replace('_', ' ')}{product.activeIngredient ? ` · ${product.activeIngredient}` : ''}</AppText>
    {product.targetCrop ? <AppText>Crop: {product.targetCrop}</AppText> : null}
    {product.targetSpecies ? <AppText>Species: {product.targetSpecies}</AppText> : null}
    {product.disease ? <AppText>Reference: {product.disease}</AppText> : null}
    {product.description ? <AppText>{product.description}</AppText> : null}
    <SourceBadge source={product.source} />
  </AppCard>;
}
