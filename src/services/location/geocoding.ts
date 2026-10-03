export type LocationSearchResult = {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  admin2?: string;
  country?: string;
};

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const params = new URLSearchParams({
    name: query.trim(),
    count: '8',
    language: 'en',
    format: 'json',
    countryCode: 'BW',
  });

  const response = await fetch(
    'https://geocoding-api.open-meteo.com/v1/search?' + params.toString(),
  );

  if (!response.ok) throw new Error('Location search is unavailable.');

  const body = (await response.json()) as {
    results?: Array<{
      id: string | number;
      name: string;
      latitude: number;
      longitude: number;
      admin1?: string;
      admin2?: string;
      country?: string;
    }>;
  };

  return body.results ?? [];
}

export function formatLocation(result: LocationSearchResult) {
  return [result.name, result.admin2, result.admin1]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(', ');
}
