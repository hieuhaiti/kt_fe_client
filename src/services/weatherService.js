import { fetcher } from "@/services/apiClient/fetcher";
import { withQuery } from "@/services/apiClient/request";

const WEATHER_PATH = "/weather";

const apiBaseUrl = () =>
  (import.meta.env.VITE_BASE_URL_BE || "").trim().replace(/\/$/, "");

export function getWeatherLayers(params = {}) {
  return fetcher(withQuery(`${WEATHER_PATH}/layers`, { lang: "vi", ...params }));
}

export function getWeatherPoint({ lng, lat, lang = "vi" }) {
  return fetcher(withQuery(`${WEATHER_PATH}/point`, { lng, lat, lang }));
}

export function getWeatherWindGrid({ bbox, grid = 8, lang = "vi" }) {
  return fetcher(withQuery(`${WEATHER_PATH}/wind-grid`, { bbox, grid, lang }));
}

export function buildWeatherTileUrl(type) {
  return `${apiBaseUrl()}${WEATHER_PATH}/tiles/${type}/{z}/{x}/{y}.png?lang=vi`;
}
