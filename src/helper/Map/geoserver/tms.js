import {
  GEOSERVER_DEFAULT_VERSIONS,
  GEOSERVER_SERVICE_TYPES,
} from "@/constant/geoserverData";
import {
  buildGeoServerWorkspaceUrl,
  getGeoServerPublicUrl,
  getOgcLayerName,
  getOgcWorkspace,
} from "./common";

export const buildTmsTileUrl = (
  layer,
  { srs = "EPSG:3857", formatExtension = "png" } = {},
) => {
  const geoserverUrl = getGeoServerPublicUrl(layer);
  const workspace = getOgcWorkspace(layer);
  const ogcLayerName = getOgcLayerName(layer);
  if (!geoserverUrl || !ogcLayerName) return "";

  const params = new URLSearchParams({
    service: GEOSERVER_SERVICE_TYPES.TMS,
    version: GEOSERVER_DEFAULT_VERSIONS[GEOSERVER_SERVICE_TYPES.TMS],
    request: "GetTile",
  });

  return `${buildGeoServerWorkspaceUrl(
    geoserverUrl,
    workspace,
    "gwc/service/tms",
  )}/${GEOSERVER_DEFAULT_VERSIONS[GEOSERVER_SERVICE_TYPES.TMS]}/${encodeURIComponent(
    ogcLayerName,
  )}@${srs}@${formatExtension}/{z}/{x}/{y}.${formatExtension}?${params.toString()}`;
};
