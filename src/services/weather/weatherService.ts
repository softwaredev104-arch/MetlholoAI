export type CurrentWeather = {
  temperature: number;
  windSpeed: number;
  humidity: number;
  precipitationProbability?: number;
  weatherCode: number;
  label: string;
};

function weatherLabel(code: number) {
  if (code === 0) return 'Clear';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorms';
  return 'Conditions unavailable';
}

export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    daily: 'precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '1',
  });

  const response = await fetch(
    'https://api.open-meteo.com/v1/forecast?' + params.toString(),
  );
  if (!response.ok) throw new Error('Weather service is unavailable.');

  const body = (await response.json()) as any;
  const current = body.current ?? {};

  return {
    temperature: Number(current.temperature_2m ?? 0),
    windSpeed: Number(current.wind_speed_10m ?? 0),
    humidity: Number(current.relative_humidity_2m ?? 0),
    weatherCode: Number(current.weather_code ?? -1),
    precipitationProbability: Number(
      body.daily?.precipitation_probability_max?.[0] ?? 0,
    ),
    label: weatherLabel(Number(current.weather_code ?? -1)),
  };
}
