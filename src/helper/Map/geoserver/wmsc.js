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

export const buildWmscTileUrl = (
  layer,
  {
    srs = "EPSG:3857",
    format = GEOSERVER_OUTPUT_FORMATS.WMS_IMAGE,
    styles = "",
  } = {},
) => {
  const geoserverUrl = getGeoServerPublicUrl(layer);
  const workspace = getOgcWorkspace(layer);
  const ogcLayerName = getOgcLayerName(layer);
  if (!geoserverUrl || !ogcLayerName) return "";

  const params = new URLSearchParams({
    service: GEOSERVER_SERVICE_TYPES.WMS,
    version: GEOSERVER_DEFAULT_VERSIONS[GEOSERVER_SERVICE_TYPES.WMSC],
    request: "GetMap",
    layers: ogcLayerName,
    styles,
    width: "256",
    height: "256",
    srs,
    format,
    transparent: "true",
    tiled: "true",
  });

  return `${buildGeoServerWorkspaceUrl(
    geoserverUrl,
    workspace,
    "wms",
  )}?${params.toString()}&bbox={bbox-epsg-3857}`;
};
