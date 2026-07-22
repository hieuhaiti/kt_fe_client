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

export const buildWcsCoverageUrl = (
  layer,
  {
    coverageId = getOgcLayerName(layer),
    format = GEOSERVER_OUTPUT_FORMATS.WCS_GEOTIFF,
    subset = [],
  } = {},
) => {
  const geoserverUrl = getGeoServerPublicUrl(layer);
  const workspace = getOgcWorkspace(layer);
  if (!geoserverUrl || !coverageId) return "";

  const params = new URLSearchParams({
    service: GEOSERVER_SERVICE_TYPES.WCS,
    version: GEOSERVER_DEFAULT_VERSIONS[GEOSERVER_SERVICE_TYPES.WCS],
    request: "GetCoverage",
    coverageId,
    format,
  });

  subset.forEach((item) => params.append("subset", item));

  return `${buildGeoServerWorkspaceUrl(
    geoserverUrl,
    workspace,
    "wcs",
  )}?${params.toString()}`;
};
