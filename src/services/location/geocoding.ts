export type LocationSearchResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  countryCode?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
};

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const value = query.trim();
  if (value.length < 2) return [];
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', value);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'en');
  url.searchParams.set('countryCode', 'BW');
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Location search is temporarily unavailable.');
  const data = await response.json() as { results?: Array<LocationSearchResult & { country_code?: string }> };
  return (data.results ?? []).map(item => ({
    ...item,
    countryCode: item.countryCode ?? item.country_code,
  }));
}

export function formatLocation(result: LocationSearchResult) {
  return [result.name, result.admin1, result.country].filter(Boolean).join(', ');
}
