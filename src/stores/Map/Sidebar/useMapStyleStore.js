import { create } from "zustand";
import { defaultStyle, stateTerrainRender } from "@/constant/mapData";

const SATELLITE_STYLE = import.meta.env.VITE_MAPBOX_STYLE_Satellite;

export const useMapStyleStore = create((set, get) => ({
  mapStyle: defaultStyle,
  terrainState: stateTerrainRender,
  terrainLoading: false,
  clickedPointMode: false,
  previousStyle: null,

  setMapStyle: (style) => {
    const { clickedPointMode } = get();
    if (clickedPointMode) return;
    set({ mapStyle: style });
  },
  setTerrainState: (style) => {
    const nextTerrainState = style === true;
    set({ terrainState: nextTerrainState });
  },
  setTerrainLoading: (loading) => set({ terrainLoading: loading === true }),

  // Toggle clickedPointMode - auto switch to Satellite style
  toggleClickedPointMode: () => {
    const { clickedPointMode, mapStyle } = get();

    if (!clickedPointMode) {
      set({
        clickedPointMode: true,
        previousStyle: mapStyle,
        mapStyle: SATELLITE_STYLE,
      });
    } else {
      const { previousStyle } = get();
      set({
        clickedPointMode: false,
        mapStyle: previousStyle || defaultStyle,
        previousStyle: null,
      });
    }
  },

  setClickedPointMode: (mode) => {
    const { mapStyle } = get();
    if (mode) {
      set({
        clickedPointMode: true,
        previousStyle: mapStyle,
        mapStyle: SATELLITE_STYLE,
      });
    } else {
      const { previousStyle } = get();
      set({
        clickedPointMode: false,
        mapStyle: previousStyle || defaultStyle,
        previousStyle: null,
      });
    }
  },
}));
