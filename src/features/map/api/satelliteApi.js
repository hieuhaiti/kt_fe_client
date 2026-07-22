import { useApiMutation } from "@/services/apiClient/useApi";
import { mutater } from "@/services/apiClient/mutater";
import { serviceSatellitePath } from "@/constant/serviceData";

/**
 * RGB Composite Hook
 * @param {Object} options - Query options
 * @returns React Query mutation
 */
export function useGetRgbCompositeMutation(options = {}) {
  return useApiMutation(
    ["satellite", "rgb"],
    `${serviceSatellitePath}/rgb`,
    "POST",
    options,
  );
}

/**
 * NDVI Hook
 * @param {Object} options - Query options
 * @returns React Query mutation
 */
export function useGetNdviMutation(options = {}) {
  return useApiMutation(
    ["satellite", "ndvi"],
    `${serviceSatellitePath}/ndvi`,
    "POST",
    options,
  );
}

/**
 * Heatmap (LST) Hook
 * @param {Object} options - Query options
 * @returns React Query mutation
 */
export function useGetHeatmapMutation(options = {}) {
  return useApiMutation(
    ["satellite", "heatmap"],
    `${serviceSatellitePath}/heat-map`,
    "POST",
    options,
  );
}

/**
 * Classified Hook
 * @param {Object} options - Query options
 * @returns React Query mutation
 */
export function useGetClassifiedMutation(options = {}) {
  return useApiMutation(
    ["satellite", "classified"],
    `${serviceSatellitePath}/classified`,
    "POST",
    options,
  );
}

/**
 * RGB Composite - Ảnh composite True Color
 * @param {Object} params - { startDate, endDate, collection?, cloudCover? }
 * @returns {Promise<Object>}
 */
export async function getRgbComposite(params) {
  return mutater(`${serviceSatellitePath}/rgb`, "POST", params);
}

/**
 * NDVI - Ảnh NDVI + diện tích thực vật
 * @param {Object} params - { startDate, endDate, ndviMinThresh?, collection?, cloudCover? }
 * @returns {Promise<Object>}
 */
export async function getNdvi(params) {
  return mutater(`${serviceSatellitePath}/ndvi`, "POST", params);
}

/**
 * Heatmap - Bản đồ nhiệt LST (Land Surface Temperature)
 * @param {Object} params - { startDate, endDate, collection?, cloudCover? }
 * @returns {Promise<Object>}
 */
export async function getHeatmap(params) {
  return mutater(`${serviceSatellitePath}/heat-map`, "POST", params);
}

/**
 * Classified - Ảnh phân loại lớp phủ (11 lớp)
 * @param {Object} params - { startDate, endDate, collection?, cloudCover? }
 * @returns {Promise<Object>}
 */
export async function getClassified(params) {
  return mutater(`${serviceSatellitePath}/classified`, "POST", params);
}

// =====================================================================
// Unified SatelliteService (NB-style)
// =====================================================================
const normalizeLayerType = (type) => {
  if (!type) return "rgb";
  const key = String(type).toLowerCase();
  if (key === "swir-urban" || key === "swir urban" || key === "swir")
    return "heatmap";
  if (key === "heat-map" || key === "heat_map") return "heatmap";
  return key;
};

const LAYER_SERVICE_MAP = {
  rgb: getRgbComposite,
  ndvi: getNdvi,
  heatmap: getHeatmap,
  classified: getClassified,
};

export const SatelliteService = {
  async getSatelliteImage(params) {
    const layerType = normalizeLayerType(params?.layerType || params?.type);
    const service = LAYER_SERVICE_MAP[layerType] || getRgbComposite;

    const requestParams = {
      startDate: params?.startDate,
      endDate: params?.endDate,
      collection: params?.collection,
      cloudCover: params?.cloudCover,
    };

    return service(requestParams);
  },
};
