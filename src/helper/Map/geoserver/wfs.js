import {
  GEOSERVER_DEFAULT_VERSIONS,
  GEOSERVER_OUTPUT_FORMATS,
  GEOSERVER_SERVICE_TYPES,
} from "@/constant/geoserverData";
import {
  buildGeoServerWorkspaceUrl,
  getGeoServerPublicUrl,
  getOgcLayerName,
  getOgcWorkspace,
} from "./common";

export const buildWfsFeatureUrl = (
  layer,
  { count = 5000, srsName = "EPSG:4326", bbox } = {},
) => {
  const geoserverUrl = getGeoServerPublicUrl(layer);
  const workspace = getOgcWorkspace(layer);
  const ogcLayerName = getOgcLayerName(layer);
  if (!geoserverUrl || !ogcLayerName) return "";

  const params = new URLSearchParams({
    service: GEOSERVER_SERVICE_TYPES.WFS,
    version: GEOSERVER_DEFAULT_VERSIONS[GEOSERVER_SERVICE_TYPES.WFS],
    request: "GetFeature",
    typeNames: ogcLayerName,
    outputFormat: GEOSERVER_OUTPUT_FORMATS.WFS_GEOJSON,
    srsName,
    count: String(count),
  });

  if (bbox) params.set("bbox", bbox);

  return `${buildGeoServerWorkspaceUrl(
    geoserverUrl,
    workspace,
    "wfs",
  )}?${params.toString()}`;
};

export const fetchWfsGeoJson = async (layer, options) => {
  const url = buildWfsFeatureUrl(layer, options);
  if (!url) return { type: "FeatureCollection", features: [] };

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GeoServer WFS ${response.status}`);
  }

  const data = await response.json();
  if (data?.type === "FeatureCollection") return data;

  return {
    type: "FeatureCollection",
    features: Array.isArray(data?.features) ? data.features : [],
  };
};
