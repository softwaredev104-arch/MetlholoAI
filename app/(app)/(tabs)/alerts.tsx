import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';

export default function Alerts() {
  return (
    <AppScreen>
      <AppText variant="largeTitle">Alerts</AppText>
      <AppCard>
        <AppText variant="headline">No alerts yet</AppText>
        <AppText>Weather, health, inventory and recommendation alerts will appear here when those modules are connected.</AppText>
      </AppCard>
    </AppScreen>
  );
}