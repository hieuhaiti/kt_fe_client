import { create } from "zustand";

export const useMapStore = create((set, get) => ({
  mapInstance: null,
  mapRefObj: null, // full ref: { single, split, compare }
  highlightedFeature: null, // GeoJSON Feature (Point/Line/Polygon) để highlight trên map
  clickedPoint: null, // { lat, lng }
  category: null,
  // Dữ liệu category layers đang hiển thị trên map: { [sourceId]: geojson }
  categoryLayersData: {},
  ogcLayersData: {},
  // compare map
  isSplitMode: false,

  // Sidebar - panel đang active (chia sẻ giữa floating icon bar và content panel)
  activePanel: null,
  setActivePanel: (activePanel) => set({ activePanel }),

  setMapRef: (mapInstance) => {
    set({ mapInstance });
  },

  // Lưu full mapRef (useRef object) để stores truy cập single/split maps
  setMapRefObj: (ref) => {
    set({ mapRefObj: ref });
  },

  getMap: () => {
    const { mapInstance } = get();
    return mapInstance;
  },

  clearMapRef: () => {
    set({ mapInstance: null });
  },

  setCategory: (category) => {
    set({ category });
  },

  // Highlight feature (Point/Line/Polygon)
  setHighlightedFeature: (feature) => {
    set({ highlightedFeature: feature });
  },

  clearHighlightedFeature: () => {
    set({ highlightedFeature: null });
  },

  setClickedPoint: (point) => {
    set({ clickedPoint: point });
  },

  clearClickedPoint: () => {
    set({ clickedPoint: null });
  },

  // Category layer data management
  setCategoryLayerData: (sourceId, geojson, geometryType, color, icon) => {
    set((state) => ({
      categoryLayersData: {
        ...state.categoryLayersData,
        [sourceId]: { geojson, geometryType, color, icon },
      },
    }));
  },

  setSplitMode: (isSplitMode) => {
    set({ isSplitMode });
  },

  removeCategoryLayerData: (sourceId) => {
    set((state) => {
      const next = { ...state.categoryLayersData };
      delete next[sourceId];
      return { categoryLayersData: next };
    });
  },

  clearAllCategoryLayersData: () => {
    set({ categoryLayersData: {} });
  },

  setOgcLayerData: (sourceId, layer) => {
    set((state) => ({
      ogcLayersData: {
        ...state.ogcLayersData,
        [sourceId]: layer,
      },
    }));
  },

  removeOgcLayerData: (sourceId) => {
    set((state) => {
      const next = { ...state.ogcLayersData };
      delete next[sourceId];
      return { ogcLayersData: next };
    });
  },

  clearAllOgcLayersData: () => {
    set({ ogcLayersData: {} });
  },
}));
