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

export async function getCurrentWeather(latitude = BOTSWANA_WEATHER_FALLBACK.latitude, longitude = BOTSWANA_WEATHER_FALLBACK.longitude): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error('Weather service unavailable.');
  const data = await response.json();
  return {
    latitude,
    longitude,
    temperature: Number(data.current?.temperature_2m ?? 0),
    apparentTemperature: Number(data.current?.apparent_temperature ?? 0),
    humidity: Number(data.current?.relative_humidity_2m ?? 0),
    windSpeed: Number(data.current?.wind_speed_10m ?? 0),
    weatherCode: Number(data.current?.weather_code ?? 0),
  };
}
