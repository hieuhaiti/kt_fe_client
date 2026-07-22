import { getWeatherPoint } from "@/services/weatherService";

export async function fetchWeather(lat, lon, lang = "vi") {
  const response = await getWeatherPoint({ lat, lng: lon, lang });
  const data = response?.data || {};

  return {
    name: data.location || "Kon Tum",
    coord: {
      lat: data.coord?.lat ?? lat,
      lon: data.coord?.lng ?? lon,
    },
    main: {
      temp: data.temp,
      feels_like: data.feelsLike,
      temp_min: data.tempMin,
      temp_max: data.tempMax,
      humidity: data.humidity,
      pressure: data.pressure,
    },
    weather: data.weather ? [data.weather] : [],
    wind: data.wind || {},
    clouds: { all: data.clouds },
    visibility: data.visibility,
    rain: { "1h": data.rain1h || 0 },
    snow: { "1h": data.snow1h || 0 },
    observedAt: data.observedAt,
    cached: data.cached,
    stale: data.stale,
  };
}

export async function fetchAQI() {
  return null;
}

export async function fetchForecast() {
  return [];
}
