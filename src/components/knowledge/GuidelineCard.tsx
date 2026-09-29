import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { CropGuideline } from '@/services/knowledge/models';
import { SourceBadge } from './SourceBadge';

export function GuidelineCard({ guideline }: { guideline: CropGuideline }) {
  return <AppCard>
    <AppText variant="headline">{guideline.problem}</AppText>
    {guideline.crop ? <AppText>Crop: {guideline.crop}</AppText> : null}
    {guideline.recommendations.map((item, index) => <AppCard key={index}>
      <AppText variant="headline">{item.productName ?? 'Reference recommendation'}</AppText>
      {item.activeIngredient ? <AppText>{item.activeIngredient}</AppText> : null}
      {item.rate ? <AppText>Rate: {item.rate}</AppText> : null}
      {item.instructions ? <AppText>{item.instructions}</AppText> : null}
    </AppCard>)}
    <SourceBadge source={guideline.source} />
  </AppCard>;
}
