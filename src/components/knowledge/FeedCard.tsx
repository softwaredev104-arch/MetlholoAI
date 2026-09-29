import { AgriculturalInputCard } from './AgriculturalInputCard';
import type { AgriculturalProduct } from '@/services/knowledge/models';

export function FeedCard({ product }: { product: AgriculturalProduct }) {
  return <AgriculturalInputCard product={product} />;
}
