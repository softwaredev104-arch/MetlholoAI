import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { MarketplaceListing } from '@/services/marketplace/marketplaceRepository';

export function MarketplaceListingCard({ listing }: { listing: MarketplaceListing }) {
  return <AppCard>
    <AppText variant="headline">{listing.title}</AppText>
    <AppText>{listing.listingType.replace('_', ' ')} · {listing.status}</AppText>
    {listing.description ? <AppText>{listing.description}</AppText> : null}
    {listing.quantity !== undefined ? <AppText>Quantity: {listing.quantity}{listing.unit ? ` ${listing.unit}` : ''}</AppText> : null}
    {listing.price !== undefined ? <AppText>{listing.currency} {listing.price.toFixed(2)}</AppText> : null}
    {listing.catalogProductId ? <AppText style={{ opacity: 0.65 }}>Reference catalog linked</AppText> : null}
  </AppCard>;
}
