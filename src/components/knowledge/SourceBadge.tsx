import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { KnowledgeSource } from '@/services/knowledge/models';

export function SourceBadge({ source }: { source: KnowledgeSource }) {
  return <AppCard>
    <AppText variant="caption">SOURCE</AppText>
    <AppText variant="headline">{source.source}</AppText>
    {source.sourceDocument ? <AppText>{source.sourceDocument}</AppText> : null}
    <AppText style={{ opacity: 0.65 }}>{source.country} · {source.extractionMethod ?? 'unknown extraction'} · {source.confidence} confidence</AppText>
  </AppCard>;
}
