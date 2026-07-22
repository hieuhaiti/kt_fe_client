import { useQuery } from "@tanstack/react-query";
import { fetchWeather, fetchAQI, fetchForecast } from "./helpper.js";
import { defaultLatLong } from "@/constant/mapData";

export function useWeather(
  lat = defaultLatLong.lat,
  lon = defaultLatLong.lng,
  lang = "vi",
) {
  return useQuery({
    queryKey: ["weather", "point", lat, lon, lang],
    queryFn: () => fetchWeather(lat, lon, lang),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
  });
}

export function useForecast(
  lat = defaultLatLong.lat,
  lon = defaultLatLong.lng,
) {
  return useQuery({
    queryKey: ["forecast", lat, lon],
    queryFn: () => fetchForecast(lat, lon),
    enabled: false,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useAQI(lat = defaultLatLong.lat, lon = defaultLatLong.lng) {
  return useQuery({
    queryKey: ["aqi", lat, lon],
    queryFn: () => fetchAQI(lat, lon),
    enabled: false,
    staleTime: 15 * 60 * 1000,
    retry: false,
  });
}

export function useWeatherAndAQI(
  lat = defaultLatLong.lat,
  lon = defaultLatLong.lng,
  lang = "vi",
) {
  const weather = useWeather(lat, lon, lang);
  const aqi = useAQI(lat, lon);

  return {
    weather,
    aqi,
    isLoading: weather.isLoading,
    isError: weather.isError,
    error: weather.error,
  };
}
