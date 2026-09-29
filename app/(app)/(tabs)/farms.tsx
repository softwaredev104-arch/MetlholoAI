import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';

export default function Farms() {
  return (
    <AppScreen>
      <AppText variant="largeTitle">Farms</AppText>
      <AppCard>
        <AppText variant="headline">Farm management foundation</AppText>
        <AppText>Farm creation, ownership, Firestore queries and farm-level authorization are next in Phase 2.</AppText>
      </AppCard>
    </AppScreen>
  );
}