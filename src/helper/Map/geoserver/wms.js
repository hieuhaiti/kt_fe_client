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
  lngLatToWebMercator,
} from "./common";

export const buildWmsTileUrl = (layer) => {
  const geoserverUrl = getGeoServerPublicUrl(layer);
  const workspace = getOgcWorkspace(layer);
  const ogcLayerName = getOgcLayerName(layer);
  if (!geoserverUrl || !ogcLayerName) return "";

  const params = new URLSearchParams({
    service: GEOSERVER_SERVICE_TYPES.WMS,
    version: GEOSERVER_DEFAULT_VERSIONS[GEOSERVER_SERVICE_TYPES.WMS],
    request: "GetMap",
    layers: ogcLayerName,
    styles: "",
    width: "256",
    height: "256",
    crs: "EPSG:3857",
    format: GEOSERVER_OUTPUT_FORMATS.WMS_IMAGE,
    transparent: "true",
    tiled: "true",
  });

  return `${buildGeoServerWorkspaceUrl(
    geoserverUrl,
    workspace,
    "wms",
  )}?${params.toString()}&bbox={bbox-epsg-3857}`;
};

export const buildWmsFeatureInfoUrl = (map, layer, point) => {
  const geoserverUrl = getGeoServerPublicUrl(layer);
  const workspace = getOgcWorkspace(layer);
  const ogcLayerName = getOgcLayerName(layer);
  if (!map || !geoserverUrl || !ogcLayerName || !point) return "";

  const bounds = map.getBounds();
  const sw = lngLatToWebMercator(bounds.getSouthWest());
  const ne = lngLatToWebMercator(bounds.getNorthEast());
  const canvas = map.getCanvas();
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  const params = new URLSearchParams({
    service: GEOSERVER_SERVICE_TYPES.WMS,
    version: GEOSERVER_DEFAULT_VERSIONS[GEOSERVER_SERVICE_TYPES.WMS],
    request: "GetFeatureInfo",
    layers: ogcLayerName,
    query_layers: ogcLayerName,
    styles: "",
    bbox: `${sw[0]},${sw[1]},${ne[0]},${ne[1]}`,
    width: String(width),
    height: String(height),
    crs: "EPSG:3857",
    i: String(Math.round(point.x)),
    j: String(Math.round(point.y)),
    info_format: GEOSERVER_OUTPUT_FORMATS.WMS_FEATURE_INFO,
    feature_count: "5",
  });

  return `${buildGeoServerWorkspaceUrl(
    geoserverUrl,
    workspace,
    "wms",
  )}?${params.toString()}`;
};
