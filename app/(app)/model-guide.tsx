import { useLocalSearchParams, router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { ModelCaptureGuide } from '@/components/intelligence/CaptureGuidance';
import { INTELLIGENCE_MODELS } from '@/services/intelligence/catalog';

export default function ModelGuide() {
  const { modelId } = useLocalSearchParams<{ modelId: string }>();
  const model = INTELLIGENCE_MODELS.find(item => item.id === modelId);

  if (!model) {
    return (
      <AppScreen>
        <AppText variant="largeTitle">Model unavailable</AppText>
        <AppText>This model could not be found. No training photograph has been assumed.</AppText>
        <AppButton title="Open scanner" onPress={() => router.push('/(app)/scan' as any)} />
      </AppScreen>
    );
  }

  return (
    <AppScreen maxWidth={900}>
      <ModelCaptureGuide
        model={model}
        onContinue={() => router.push({ pathname: '/(app)/scan', params: { preferredModelId: model.id } })}
        onChangeModel={() => router.back()}
      />
    </AppScreen>
  );
}
