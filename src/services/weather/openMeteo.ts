import { z } from 'zod';

export type WeatherSnapshot = {
  latitude: number;
  longitude: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
};

export const BOTSWANA_WEATHER_FALLBACK = { latitude: -24.6282, longitude: 25.9231 };

const WeatherResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
    weather_code: z.number(),
  }),
});

export async function getCurrentWeather(
  latitude = BOTSWANA_WEATHER_FALLBACK.latitude,
  longitude = BOTSWANA_WEATHER_FALLBACK.longitude,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error('Weather service unavailable.');

  const raw: unknown = await response.json();
  const data = WeatherResponseSchema.safeParse(raw);
  if (!data.success) throw new Error('Weather service returned an invalid response.');

  return {
    latitude,
    longitude,
    temperature: data.data.current.temperature_2m,
    apparentTemperature: data.data.current.apparent_temperature,
    humidity: data.data.current.relative_humidity_2m,
    windSpeed: data.data.current.wind_speed_10m,
    weatherCode: data.data.current.weather_code,
  };
}
