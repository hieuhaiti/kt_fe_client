import { useApiQuery } from "@/services/apiClient/useApi";
import { fetcher } from "@/services/apiClient/fetcher";
import { serviceMapLayerPath } from "@/constant/serviceData";

function buildQuery(params = {}) {
  const queryParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;

    if (key === "search") {
      queryParams.append("q", String(value));
      return;
    }

    if (["sortBy", "sortOrder", "geometry_type"].includes(key)) return;

    queryParams.append(key, String(value));
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : "";
}

function getLayerItems(response) {
  return response?.data?.items || response?.data?.layers || response?.items || [];
}

function getLayerName(layer) {
  return layer?.name_vi || layer?.name_en || layer?.name || layer?.code || "";
}

function normalizeGeometryType(geometryType) {
  const type = String(geometryType || "").toLowerCase();
  if (type.includes("polygon")) return "polygon";
  if (type.includes("line")) return "line";
  if (type.includes("point")) return "point";
  return type || "geometry";
}

function mapRegistryLayerToLegacyLayer(layer) {
  return {
    ...layer,
    id: layer.code || layer.id,
    category: layer.category || layer.layer_group || "khac",
    name: getLayerName(layer),
    geometry_type: normalizeGeometryType(layer.geometry_type),
    geometry_data: layer.bbox || null,
    properties: {
      code: layer.code,
      category: layer.category,
      layer_group: layer.layer_group,
      feature_count: layer.feature_count,
      table_name: layer.table_name,
      geoserver_layer: layer.geoserver_layer,
    },
  };
}

function normalizeCategoryLayerResponse(response, categoryId) {
  const mapLayers = getLayerItems(response).map(mapRegistryLayerToLegacyLayer);

  return {
    ...response,
    data: {
      ...response?.data,
      mapLayers,
      total: response?.data?.pagination?.total ?? mapLayers.length,
      category: categoryId,
    },
  };
}

export function useGetMapLayersByCategoryQuery(
  categoryId,
  params = {},
  options = {},
) {
  const endpoint = `${serviceMapLayerPath}${buildQuery({
    ...params,
    category: categoryId,
  })}`;

  return useApiQuery(
    ["map", "layers", "category", categoryId, params],
    endpoint,
    {
      ...options,
      enabled:
        !!categoryId &&
        (options.enabled !== undefined ? options.enabled : true),
      select: (response) => {
        const selected = normalizeCategoryLayerResponse(response, categoryId);
        return options.select ? options.select(selected) : selected;
      },
    },
  );
}

export async function getMapLayersByCategory(categoryId, params = {}) {
  const response = await fetcher(
    `${serviceMapLayerPath}${buildQuery({ ...params, category: categoryId })}`,
  );
  return normalizeCategoryLayerResponse(response, categoryId);
}

export function useGetMapLayersQuery(params = {}, options = {}) {
  const endpoint = `${serviceMapLayerPath}${buildQuery(params)}`;

  return useApiQuery(["map", "layers", params], endpoint, {
    ...options,
    enabled: options.enabled !== undefined ? options.enabled : true,
  });
}

export function getMapLayers(params = {}) {
  return fetcher(`${serviceMapLayerPath}${buildQuery(params)}`);
}

export function useGetMapLayerQuery(layerCode, options = {}) {
  return useApiQuery(
    ["map", "layers", "detail", layerCode],
    `${serviceMapLayerPath}/${encodeURIComponent(layerCode)}`,
    {
      ...options,
      enabled:
        !!layerCode && (options.enabled !== undefined ? options.enabled : true),
    },
  );
}

export function getMapLayer(layerCode) {
  return fetcher(`${serviceMapLayerPath}/${encodeURIComponent(layerCode)}`);
}
