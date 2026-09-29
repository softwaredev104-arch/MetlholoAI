import { getCurrentWeather } from '@/services/weather/openMeteo';

describe('weather API contract', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
  });

  it('maps a valid Open-Meteo response', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({
      current: {
        temperature_2m: 27,
        apparent_temperature: 28,
        relative_humidity_2m: 42,
        wind_speed_10m: 12,
        weather_code: 1,
      },
    }) });

    await expect(getCurrentWeather(-24.6, 25.9)).resolves.toMatchObject({
      latitude: -24.6,
      longitude: 25.9,
      temperature: 27,
      humidity: 42,
      weatherCode: 1,
    });
  });

  it('rejects malformed weather responses', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ current: {} }) });
    await expect(getCurrentWeather()).rejects.toThrow('invalid response');
  });

  it('rejects HTTP failures', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(getCurrentWeather()).rejects.toThrow('Weather service unavailable');
  });
});
