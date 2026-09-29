import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Spacing } from '@/design/spacing';
import type { FarmRecommendation } from '@/services/recommendations/recommendationService';

const priorityLabel = { critical: 'Critical attention', high: 'High priority', medium: 'Recommended', low: 'Monitor' } as const;

export function RecommendationCard({ recommendation }: { recommendation: FarmRecommendation }) {
  function act() {
    if (recommendation.action === 'diagnose') {
      router.push({ pathname: '/scan', params: { recordType: recommendation.assetType, recordId: recommendation.assetId } });
      return;
    }
    router.push('/farm');
  }
  return <AppCard style={styles.card}>
    <View style={styles.header}><AppText variant="caption">{priorityLabel[recommendation.priority]}</AppText>{recommendation.confidence !== undefined ? <AppText variant="caption">{recommendation.confidence.toFixed(1)}% model confidence</AppText> : null}</View>
    <AppText variant="headline">{recommendation.title}</AppText><AppText style={styles.summary}>{recommendation.summary}</AppText>
    {recommendation.evidence.slice(0, 3).map(item => <AppText key={item} style={styles.evidence}>• {item}</AppText>)}
    <AppButton title={recommendation.action === 'diagnose' ? 'Run another diagnosis' : 'Open farm workflow'} variant="secondary" onPress={act} />
  </AppCard>;
}

const styles = StyleSheet.create({ card: { marginTop: Spacing.md, gap: Spacing.sm }, header: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm }, summary: { opacity: 0.78 }, evidence: { opacity: 0.68 } });