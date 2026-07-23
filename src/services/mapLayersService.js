import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { useApiQuery } from "@/services/apiClient/useApi";
import { withQuery } from "@/services/apiClient/request";

const MAP_PATH = "/map";
const LAYERS_PATH = `${MAP_PATH}/layers`;

export function getMapLayers(params = {}) {
  return fetcher(withQuery(LAYERS_PATH, { lang: "vi", ...params }));
}

export function useGetMapLayersQuery(params = {}, options = {}) {
  const queryParams = { lang: "vi", ...params };

  return useApiQuery(
    ["map", "layers", queryParams],
    withQuery(LAYERS_PATH, queryParams),
    options,
  );
}

export function getMapLayer(layerCode) {
  return fetcher(`${LAYERS_PATH}/${encodeURIComponent(layerCode)}`);
}

export function createMapLayer(payload) {
  return mutater(LAYERS_PATH, "POST", payload);
}

export function updateMapLayer(layerCode, payload) {
  return mutater(
    `${LAYERS_PATH}/${encodeURIComponent(layerCode)}`,
    "PATCH",
    payload,
  );
}

export function deleteMapLayer(layerCode) {
  return mutater(`${LAYERS_PATH}/${encodeURIComponent(layerCode)}`, "DELETE");
}

export function publishMapLayer(layerCode) {
  return mutater(
    `${LAYERS_PATH}/${encodeURIComponent(layerCode)}/publish`,
    "POST",
  );
}

export function unpublishMapLayer(layerCode) {
  return mutater(
    `${LAYERS_PATH}/${encodeURIComponent(layerCode)}/publish`,
    "DELETE",
  );
}

export function updateMapLayerActive(layerCode, isActive) {
  return mutater(
    `${LAYERS_PATH}/${encodeURIComponent(layerCode)}/active`,
    "PATCH",
    { is_active: isActive },
  );
}

export function importMapLayerFile(formData) {
  return mutater(`${LAYERS_PATH}/import-file`, "POST", formData);
}

export function getMapLayerImportJobs(layerCode) {
  return fetcher(`${LAYERS_PATH}/${encodeURIComponent(layerCode)}/import-jobs`);
}

export function getMapImportJob(importJobId) {
  return fetcher(`${MAP_PATH}/import-jobs/${encodeURIComponent(importJobId)}`);
}

export function harvestRaster(coverageStore, payload) {
  return mutater(
    `${MAP_PATH}/rasters/${encodeURIComponent(coverageStore)}/harvest`,
    "POST",
    payload,
  );
}
