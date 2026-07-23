import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  buildSatelliteSourceId,
  removeSatelliteLayerFromMap,
} from "@/helper/Map/MapHelper";
import { SatelliteService } from "@/features/map/api/satelliteApi";
import { useMapStore } from "@/stores/Map/useMapStore";

/** Trừ đúng 1 tháng, tự động kẹp ngày vào ngày cuối tháng nếu cần (vd 31/1 → 28-29/2) */
const subtractOneMonth = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  const targetYear = month === 0 ? year - 1 : year;
  const targetMonth = month === 0 ? 11 : month - 1;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(day, lastDay));
};

const toDateString = (value) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().split("T")[0];
  if (typeof value === "string") return value;
  return new Date(value).toISOString().split("T")[0];
};

const normalizeResponse = (response) => response?.data ?? response;

const sanitizeKeyPart = (value) => {
  if (!value) return "unknown";
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "_");
};

const buildImageKey = (meta) => {
  const start = toDateString(meta.startDate);
  const end = toDateString(meta.endDate);
  const layer = meta.layerType || meta.layer || "unknown";
  const collection = meta.collection || "S2";
  const splitSide = meta.splitSide || "single";
  const cloudCover = meta.cloudCover ?? "";
  return [layer, collection, start, end, splitSide, cloudCover].join("|");
};

const buildLayerIdFromKey = (key) =>
  `satellite-${sanitizeKeyPart(key)}`.slice(0, 120);

const upsertByKey = (items, nextItem) => {
  if (!nextItem) return items;
  const idx = items.findIndex((item) => item.key === nextItem.key);
  if (idx === -1) return [...items, nextItem];
  const copy = items.slice();
  copy[idx] = { ...items[idx], ...nextItem };
  return copy;
};

const buildImageFromResponse = (response, meta) => {
  const data = normalizeResponse(response);
  // Server chỉ trả `geeTileUrl` — URL tile Earth Engine trực tiếp (Google CDN).
  // Proxy `/api/v1/satellite/tiles/:id/:z/:x/:y` cũ đã gỡ, nên KHÔNG còn field
  // `tileUrl` trong response. `layerData.tileUrl` bên dưới là tên biến nội bộ
  // (không phải field API), chứa cùng URL geeTileUrl để đưa vào Mapbox source.
  const tileUrl = data?.geeTileUrl;
  if (!data || data.error || !tileUrl) return null;

  const key = buildImageKey(meta);
  const layerId = buildLayerIdFromKey(key);
  const sourceId = buildSatelliteSourceId(data.mapId || layerId, layerId);
  const start = toDateString(meta.startDate);
  const end = toDateString(meta.endDate);

  return {
    id: layerId,
    key,
    layerType: meta.layerType || meta.layer || "unknown",
    splitSide: meta.splitSide || null,
    layerOpacity: meta.layerOpacity ?? 1,
    visible: meta.visible !== false, // Default to true
    collection: meta.collection || "S2",
    cloudCover: meta.cloudCover ?? 0,
    date: start && end ? `${start} - ${end}` : "",
    preview: tileUrl,
    mapId: data.mapId,
    downloadUrl: data.downloadUrl || null,
    totalImages: data.totalImages ?? data.stats?.imageCount ?? null,
    stats: data.stats ?? null,
    areaStats: data.areaStats ?? null,
    legend: Array.isArray(data.legend) ? data.legend : [],
    visualizationParams: data.visualizationParams,
    metadata: data.metadata,
    token: data.token,
    layerData: {
      tileUrl,
      mapId: data.mapId,
      token: data.token,
      downloadUrl: data.downloadUrl || null,
    },
    sourceId,
  };
};

export const useSatelliteStore = create(
  devtools(
    (set, get) => ({
      // Part 1: Single mode analysis
      startDate: subtractOneMonth(),
      endDate: new Date(),
      selectedLayer: "ndvi",
      cloudCover: 70,
      analysisData: null,

      setStartDate: (date) => set({ startDate: date }),
      setEndDate: (date) => set({ endDate: date }),
      setSelectedLayer: (layer) => set({ selectedLayer: layer }),
      setCloudCover: (value) =>
        set({ cloudCover: Math.max(0, Math.min(100, value)) }),
      setAnalysisData: (data) => set({ analysisData: data }),

      // Part 2: Compare mode (Split View)
      isCompareMode: false,
      collection: "S2",
      startDate1: new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1,
      ),
      endDate1: new Date(),
      startDate2: new Date(
        new Date().getFullYear() - 1,
        new Date().getMonth(),
        1,
      ),
      endDate2: new Date(
        new Date().getFullYear() - 1,
        new Date().getMonth() + 1,
        0,
      ),

      setIsCompareMode: (isCompareMode) => {
        const { satelliteLayers, images } = get();
        const mapRef = useMapStore.getState().mapRefObj;

        if (isCompareMode) {
          // Chuyển từ single → compare: chỉ xóa ảnh/layer của single mode
          const singleLayers = satelliteLayers.filter(
            (l) => !l.splitSide || l.splitSide === null,
          );
          if (mapRef?.current) {
            singleLayers.forEach((layer) => {
              try {
                if (mapRef.current.single) {
                  removeSatelliteLayerFromMap(
                    mapRef.current.single,
                    layer.id,
                    layer.sourceId,
                  );
                }
              } catch (e) {
                console.error(
                  `[setIsCompareMode→compare] Error removing layer ${layer.id}:`,
                  e,
                );
              }
            });
          }
          set({
            isCompareMode: true,
            analysisData: null,
            images: { ...images, single: [] },
            isLoading: false,
            error: null,
          });
        } else {
          // Chuyển từ compare → single: chỉ xóa ảnh/layer của compare mode
          const compareLayers = satelliteLayers.filter(
            (l) => l.splitSide === "left" || l.splitSide === "right",
          );
          if (mapRef?.current) {
            compareLayers.forEach((layer) => {
              try {
                const targetMap =
                  layer.splitSide === "right"
                    ? mapRef.current.split
                    : mapRef.current.single;
                if (targetMap) {
                  removeSatelliteLayerFromMap(
                    targetMap,
                    layer.id,
                    layer.sourceId,
                  );
                }
              } catch (e) {
                console.error(
                  `[setIsCompareMode→single] Error removing layer ${layer.id}:`,
                  e,
                );
              }
            });
          }
          set({
            isCompareMode: false,
            period1Data: {
              rgb: null,
              ndvi: null,
              swir: null,
              classified: null,
            },
            period2Data: {
              rgb: null,
              ndvi: null,
              swir: null,
              classified: null,
            },
            comparisonData: null,
            images: { ...images, comparison: [] },
            isLoadingComparison: false,
            errorComparison: null,
          });
        }
        get().handleSatelliteDataChange();
      },
      setCollection: (collection) => set({ collection }),
      setStartDate1: (date) => set({ startDate1: date }),
      setEndDate1: (date) => set({ endDate1: date }),
      setStartDate2: (date) => set({ startDate2: date }),
      setEndDate2: (date) => set({ endDate2: date }),

      // Part 3: Layer selection (Compare Mode)
      activeLayerTypes: new Set(["rgb"]),

      toggleLayerType: (layerType) =>
        set((state) => {
          const newLayers = new Set(state.activeLayerTypes);
          if (newLayers.has(layerType)) {
            newLayers.delete(layerType);
          } else {
            newLayers.add(layerType);
          }
          return { activeLayerTypes: newLayers };
        }),

      setActiveLayerTypes: (layers) =>
        set({ activeLayerTypes: new Set(layers) }),

      // Part 4: Loaded data
      period1Data: { rgb: null, ndvi: null, swir: null, classified: null },
      period2Data: { rgb: null, ndvi: null, swir: null, classified: null },
      comparisonData: null,

      setPeriod1Data: (layerType, data) => {
        set((state) => {
          const image = buildImageFromResponse(data, {
            layerType,
            splitSide: "left",
            startDate: state.startDate1,
            endDate: state.endDate1,
            collection: state.collection,
            cloudCover: state.cloudCover,
          });

          return {
            period1Data: {
              ...state.period1Data,
              [layerType]: data,
            },
            images: image
              ? {
                  ...state.images,
                  comparison: upsertByKey(state.images.comparison, image),
                }
              : state.images,
          };
        });
        get().handleSatelliteDataChange();
      },

      setPeriod2Data: (layerType, data) => {
        set((state) => {
          const image = buildImageFromResponse(data, {
            layerType,
            splitSide: "right",
            startDate: state.startDate2,
            endDate: state.endDate2,
            collection: state.collection,
            cloudCover: state.cloudCover,
          });

          return {
            period2Data: {
              ...state.period2Data,
              [layerType]: data,
            },
            images: image
              ? {
                  ...state.images,
                  comparison: upsertByKey(state.images.comparison, image),
                }
              : state.images,
          };
        });
        get().handleSatelliteDataChange();
      },

      setComparisonData: (data) => set({ comparisonData: data }),

      clearPeriodData: () => {
        set((state) => ({
          period1Data: { rgb: null, ndvi: null, swir: null },
          period2Data: { rgb: null, ndvi: null, swir: null },
          images: { ...state.images, comparison: [] },
        }));
        get().handleSatelliteDataChange();
      },
      // Part 5: NB-style images & layers
      images: { single: [], comparison: [] },
      satelliteLayers: [],
      cachedResponses: {},
      customGeometry: null,

      setCustomGeometry: (geometry) => set({ customGeometry: geometry }),
      getCurrentGeometry: () => {
        const { customGeometry } = get();
        return customGeometry;
      },

      buildSingleCacheKey: (params) =>
        [
          "satellite",
          params.layerType || params.type || "rgb",
          params.collection,
          params.startDate,
          params.endDate,
          params.cloudCover,
          JSON.stringify(params.geometry)?.substring(0, 100),
        ].join("_"),

      buildComparisonCacheKey: (params) =>
        [
          "compare",
          params.layerType || params.type || "rgb",
          params.collection,
          params.startDate1,
          params.endDate1,
          params.startDate2,
          params.endDate2,
          params.cloudCover,
          JSON.stringify(params.geometry)?.substring(0, 100),
        ].join("_"),

      getCachedData: (key) => {
        const { cachedResponses } = get();
        return cachedResponses?.[key];
      },

      setCachedData: (key, data) =>
        set((state) => ({
          cachedResponses: { ...(state.cachedResponses || {}), [key]: data },
        })),

      clearCache: () => set({ cachedResponses: {} }),

      addSingleImage: (image) => {
        set((state) => ({
          images: {
            ...state.images,
            single: upsertByKey(state.images.single, image),
          },
        }));
        get().handleSatelliteDataChange();
      },

      addComparisonImages: (comparisonImages) => {
        set((state) => {
          let nextComparison = state.images.comparison;
          comparisonImages.forEach((image) => {
            nextComparison = upsertByKey(nextComparison, image);
          });
          return {
            images: {
              ...state.images,
              comparison: nextComparison,
            },
          };
        });
        get().handleSatelliteDataChange();
      },

      removeSingleImage: (imageId) => {
        set((state) => ({
          images: {
            ...state.images,
            single: state.images.single.filter((img) => img.id !== imageId),
          },
        }));
        get().handleSatelliteDataChange();
      },

      removeComparisonImages: (imageIds) => {
        set((state) => ({
          images: {
            ...state.images,
            comparison: state.images.comparison.filter(
              (img) => !imageIds.includes(img.id),
            ),
          },
        }));
        get().handleSatelliteDataChange();
      },

      // Update layer opacity
      updateLayerOpacity: (layerId, opacity) => {
        set((state) => {
          let updatedLayers = state.satelliteLayers;
          const layerIndex = updatedLayers.findIndex((l) => l.id === layerId);
          if (layerIndex !== -1) {
            updatedLayers = [...updatedLayers];
            updatedLayers[layerIndex] = {
              ...updatedLayers[layerIndex],
              layerOpacity: Math.max(0, Math.min(1, opacity)),
            };
          }
          return { satelliteLayers: updatedLayers };
        });
      },

      // Update layer visibility
      updateLayerVisibility: (layerId, visible) => {
        set((state) => {
          let updatedLayers = state.satelliteLayers;
          const layerIndex = updatedLayers.findIndex((l) => l.id === layerId);
          if (layerIndex !== -1) {
            updatedLayers = [...updatedLayers];
            updatedLayers[layerIndex] = {
              ...updatedLayers[layerIndex],
              visible: visible,
            };
          }
          return { satelliteLayers: updatedLayers };
        });
      },

      syncSingleImagesFromResults: (results, meta) => {
        if (!results) return;

        set((state) => {
          let nextSingle = state.images.single;

          Object.entries(results).forEach(([layerType, result]) => {
            const image = buildImageFromResponse(result, {
              ...meta,
              layerType,
              splitSide: null,
            });

            if (image) {
              nextSingle = upsertByKey(nextSingle, image);
            }
          });

          return {
            images: {
              ...state.images,
              single: nextSingle,
            },
          };
        });

        get().handleSatelliteDataChange();
      },

      handleSatelliteDataChange: () => {
        const { images, isCompareMode } = get();

        if (isCompareMode) {
          // All comparison images go into satelliteLayers so every loaded
          // layer type (rgb, ndvi, heatmap, …) gets added to the map.
          // Visibility per-layer is controlled by layer.visible.
          const layers = images.comparison.filter(Boolean);
          set({ satelliteLayers: layers });
          return;
        }

        if (!isCompareMode && images.single?.length > 0) {
          const newLayers = images.single.map((image) => ({
            ...image,
            splitSide: image.splitSide ?? null,
            layerOpacity: image.layerOpacity ?? 1,
          }));
          set({ satelliteLayers: newLayers });
          return;
        }

        console.warn("⚠️  No images to display. Clearing satelliteLayers.");
        set({ satelliteLayers: [] });
      },
      // Part 6: UI states
      isLoading: false,
      isLoadingComparison: false,
      error: null,
      errorComparison: null,
      legendCollapsed: false,
      activeLegendTab: "rgb",

      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsLoadingComparison: (loading) =>
        set({ isLoadingComparison: loading }),
      setError: (error) => set({ error }),
      setErrorComparison: (error) => set({ errorComparison: error }),
      clearError: () => set({ error: null }),
      clearErrorComparison: () => set({ errorComparison: null }),
      setLegendCollapsed: (collapsed) => set({ legendCollapsed: collapsed }),
      setActiveLegendTab: (tab) => {
        set({ activeLegendTab: tab });
        get().handleSatelliteDataChange();
      },

      // Part 7: API helpers (optional)
      searchImages: async (options = {}) => {
        const { startDate, endDate, collection, cloudCover, selectedLayer } =
          get();

        const layerType = options.layerType || options.type || selectedLayer;
        const requestParams = {
          startDate: toDateString(options.startDate || startDate),
          endDate: toDateString(options.endDate || endDate),
          collection: options.collection || collection,
          cloudCover: options.cloudCover ?? cloudCover,
          layerType,
        };

        set({ isCompareMode: false, isLoading: true, error: null });

        try {
          const response =
            await SatelliteService.getSatelliteImage(requestParams);

          const image = buildImageFromResponse(response, {
            ...requestParams,
            layerType,
            splitSide: null,
          });

          set((state) => {
            const newState = {
              analysisData: {
                ...(state.analysisData || {}),
                [layerType]: normalizeResponse(response),
              },
              images: image
                ? {
                    ...state.images,
                    single: upsertByKey(state.images.single, image),
                  }
                : state.images,
            };

            return newState;
          });

          get().handleSatelliteDataChange();
          return response;
        } catch (error) {
          const message =
            error?.message || "Khong the tai anh ve tinh. Vui long thu lai.";
          console.error("❌ [searchImages] Error:", error);
          set({ error: message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Part 8: Reset & clear
      resetToSingleMode: () => {
        const { satelliteLayers } = get();
        const mapRef = useMapStore.getState().mapRefObj;
        if (mapRef?.current) {
          satelliteLayers.forEach((layer) => {
            try {
              const targetMap =
                layer.splitSide === "right"
                  ? mapRef.current.split
                  : mapRef.current.single;
              if (targetMap) {
                removeSatelliteLayerFromMap(
                  targetMap,
                  layer.id,
                  layer.sourceId,
                );
              }
            } catch (e) {
              console.error(
                `[resetToSingleMode] Error removing layer ${layer.id}:`,
                e,
              );
            }
          });
        }
        set({
          isCompareMode: false,
          analysisData: null,
          period1Data: { rgb: null, ndvi: null, swir: null, classified: null },
          period2Data: { rgb: null, ndvi: null, swir: null, classified: null },
          comparisonData: null,
          images: { single: [], comparison: [] },
          satelliteLayers: [],
          isLoading: false,
          isLoadingComparison: false,
          error: null,
          errorComparison: null,
        });
      },

      // Reset settings/data for compare mode WITHOUT touching isCompareMode
      // (calling reset() would set isCompareMode: false → destroys MapboxCompare slider)
      resetCompareSettings: () => {
        const { satelliteLayers } = get();
        const mapRef = useMapStore.getState().mapRefObj;
        if (mapRef?.current) {
          satelliteLayers.forEach((layer) => {
            try {
              const targetMap =
                layer.splitSide === "right"
                  ? mapRef.current.split
                  : mapRef.current.single;
              if (targetMap) {
                removeSatelliteLayerFromMap(
                  targetMap,
                  layer.id,
                  layer.sourceId,
                );
              }
            } catch (e) {
              console.error(
                `[resetCompareSettings] Error removing layer ${layer.id}:`,
                e,
              );
            }
          });
        }
        set({
          collection: "S2",
          startDate1: new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1,
          ),
          endDate1: new Date(),
          startDate2: new Date(
            new Date().getFullYear() - 1,
            new Date().getMonth(),
            1,
          ),
          endDate2: new Date(
            new Date().getFullYear() - 1,
            new Date().getMonth() + 1,
            0,
          ),
          cloudCover: 70,
          activeLayerTypes: new Set(["rgb"]),
          period1Data: { rgb: null, ndvi: null, swir: null, classified: null },
          period2Data: { rgb: null, ndvi: null, swir: null, classified: null },
          comparisonData: null,
          images: { single: [], comparison: [] },
          satelliteLayers: [],
          cachedResponses: {},
          isLoading: false,
          isLoadingComparison: false,
          error: null,
          errorComparison: null,
          legendCollapsed: false,
          activeLegendTab: "rgb",
        });
      },

      reset: () => {
        const { satelliteLayers } = get();
        const mapRef = useMapStore.getState().mapRefObj;
        if (mapRef?.current) {
          satelliteLayers.forEach((layer) => {
            try {
              const targetMap =
                layer.splitSide === "right"
                  ? mapRef.current.split
                  : mapRef.current.single;
              if (targetMap) {
                removeSatelliteLayerFromMap(
                  targetMap,
                  layer.id,
                  layer.sourceId,
                );
              }
            } catch (e) {
              console.error(`[reset] Error removing layer ${layer.id}:`, e);
            }
          });
        }
        set({
          // Single mode
          startDate: subtractOneMonth(),
          endDate: new Date(),
          selectedLayer: "ndvi",
          cloudCover: 70,
          analysisData: null,
          // Compare mode
          isCompareMode: false,
          collection: "S2",
          startDate1: new Date(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1,
          ),
          endDate1: new Date(),
          startDate2: new Date(
            new Date().getFullYear() - 1,
            new Date().getMonth(),
            1,
          ),
          endDate2: new Date(
            new Date().getFullYear() - 1,
            new Date().getMonth() + 1,
            0,
          ),
          // Layers
          activeLayerTypes: new Set(["rgb"]),
          // Data
          period1Data: { rgb: null, ndvi: null, swir: null, classified: null },
          period2Data: { rgb: null, ndvi: null, swir: null, classified: null },
          comparisonData: null,
          images: { single: [], comparison: [] },
          satelliteLayers: [],
          cachedResponses: {},
          // UI
          isLoading: false,
          isLoadingComparison: false,
          error: null,
          errorComparison: null,
          legendCollapsed: false,
          activeLegendTab: "rgb",
          // Map
          mapCenter: [13.0, 108.0],
          mapZoom: 9,
          // Geometry
          customGeometry: null,
        });
      },

      clearData: (mapRefOverride) => {
        const { satelliteLayers } = get();

        // Prefer the passed-in ref, fallback to the one stored in useMapStore
        const mapRef = mapRefOverride ?? useMapStore.getState().mapRefObj;

        if (mapRef?.current) {
          satelliteLayers.forEach((layer) => {
            try {
              const targetMap =
                layer.splitSide === "right" || layer.splitSide === "change"
                  ? mapRef.current.split
                  : mapRef.current.single;

              if (targetMap) {
                removeSatelliteLayerFromMap(
                  targetMap,
                  layer.id,
                  layer.sourceId,
                );
              }
            } catch (error) {
              console.error(`Error removing layer ${layer.id}:`, error);
            }
          });
        }

        set({
          analysisData: null,
          period1Data: { rgb: null, ndvi: null, swir: null, classified: null },
          period2Data: { rgb: null, ndvi: null, swir: null, classified: null },
          comparisonData: null,
          images: { single: [], comparison: [] },
          satelliteLayers: [],
          error: null,
          errorComparison: null,
        });
      },
    }),
    { name: "SatelliteStore" },
  ),
);
