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

export const buildWmtsTileUrl = (
  layer,
  {
    tileMatrixSet = "EPSG:3857",
    style = "",
    format = GEOSERVER_OUTPUT_FORMATS.WMS_IMAGE,
  } = {},
) => {
  const geoserverUrl = getGeoServerPublicUrl(layer);
  const workspace = getOgcWorkspace(layer);
  const ogcLayerName = getOgcLayerName(layer);
  if (!geoserverUrl || !ogcLayerName) return "";

  const params = new URLSearchParams({
    service: GEOSERVER_SERVICE_TYPES.WMTS,
    version: GEOSERVER_DEFAULT_VERSIONS[GEOSERVER_SERVICE_TYPES.WMTS],
    request: "GetTile",
    layer: ogcLayerName,
    style,
    tilematrixset: tileMatrixSet,
    format,
    tilematrix: "{z}",
    tilerow: "{y}",
    tilecol: "{x}",
  });

  return `${buildGeoServerWorkspaceUrl(
    geoserverUrl,
    workspace,
    "gwc/service/wmts",
  )}?${params.toString()}`;
};
