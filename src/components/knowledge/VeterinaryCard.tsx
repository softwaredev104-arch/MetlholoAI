import { AgriculturalInputCard } from './AgriculturalInputCard';
import type { AgriculturalProduct } from '@/services/knowledge/models';

export function VeterinaryCard({ product }: { product: AgriculturalProduct }) {
  return <AgriculturalInputCard product={product} />;
}
