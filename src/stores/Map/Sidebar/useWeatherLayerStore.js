import { create } from "zustand";
import isEqual from "react-fast-compare";
import { Cloud, CloudRain, Gauge, Thermometer, Wind } from "lucide-react";

const WEATHER_LAYERS = [
  {
    id: "wind",
    name: "Lớp gió",
    weather_type: "wind",
    enabled: false,
    visible: true,
    color_code: "#06B6D4",
    icon: Wind,
  },
  {
    id: "temp",
    name: "Lớp nhiệt độ",
    weather_type: "temp",
    enabled: false,
    visible: true,
    color_code: "#F97316",
    icon: Thermometer,
  },
  {
    id: "rain",
    name: "Lớp lượng mưa",
    weather_type: "rain",
    enabled: false,
    visible: true,
    color_code: "#3B82F6",
    icon: CloudRain,
  },
  {
    id: "cloud",
    name: "Lớp mây",
    weather_type: "cloud",
    enabled: false,
    visible: true,
    color_code: "#94A3B8",
    icon: Cloud,
  },
  {
    id: "pressure",
    name: "Lớp áp suất",
    weather_type: "pressure",
    enabled: false,
    visible: true,
    color_code: "#8B5CF6",
    icon: Gauge,
  },
];

export const useWeatherLayerStore = create((set, get) => ({
  weatherLayers: WEATHER_LAYERS,

  setWeatherLayerState: (newLayers) => {
    const currentLayers = get().weatherLayers;
    if (isEqual(currentLayers, newLayers)) return;
    set({ weatherLayers: newLayers });
  },

  setActiveWeatherLayer: (idOrNull) =>
    set((state) => ({
      weatherLayers: state.weatherLayers.map((layer) => ({
        ...layer,
        enabled: idOrNull ? layer.id === idOrNull : false,
      })),
    })),

  toggleWeatherLayerEnabled: (id, defaultState = undefined) =>
    set((state) => ({
      weatherLayers: state.weatherLayers.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              enabled:
                defaultState !== undefined ? defaultState : !layer.enabled,
            }
          : layer,
      ),
    })),

  resetWeatherLayers: () => {
    set({ weatherLayers: WEATHER_LAYERS });
  },

  getEnabledWeatherLayers: () => {
    const { weatherLayers } = get();
    return weatherLayers.filter((layer) => layer.enabled);
  },
}));
