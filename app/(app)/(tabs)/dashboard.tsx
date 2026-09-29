import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppCard } from '@/components/ui/AppCard';

export default function Dashboard() {
  return (
    <AppScreen>
      <AppText variant="largeTitle">Dashboard</AppText>
      <AppText style={{ opacity: 0.7 }}>Your crop, livestock, health, feeding and yield analytics will live here.</AppText>
      {['Crops', 'Livestock', 'Health', 'Feeding plans', 'Yield', 'Tasks'].map(title => (
        <AppCard key={title}>
          <AppText variant="headline">{title}</AppText>
          <AppText style={{ opacity: 0.65 }}>Awaiting your farm records.</AppText>
        </AppCard>
      ))}
    </AppScreen>
  );
}