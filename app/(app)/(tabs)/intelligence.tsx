import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';

export default function Intelligence() {
  return (
    <AppScreen>
      <AppText variant="largeTitle">Intelligence</AppText>
      <AppCard>
        <AppText variant="headline">Agricultural intelligence</AppText>
        <AppText>Crop, livestock, weather and AI report modules will plug into the shared authorization and query architecture.</AppText>
      </AppCard>
    </AppScreen>
  );
}