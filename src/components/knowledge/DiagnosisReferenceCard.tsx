import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { DiagnosisReference } from '@/services/knowledge/models';

export function DiagnosisReferenceCard({ reference }: { reference: DiagnosisReference }) {
  return <AppCard>
    <AppText variant="headline">Reference knowledge</AppText>
    <AppText>{reference.prediction} · {(reference.confidence * 100).toFixed(1)}% model confidence</AppText>
    <AppText style={{ opacity: 0.7 }}>{reference.guidelines.length} guideline(s) · {reference.inputs.length} input reference(s)</AppText>
  </AppCard>;
}
