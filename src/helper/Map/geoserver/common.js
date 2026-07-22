import { GEOSERVER_LAYER_ORDER_PRIORITY } from "@/constant/geoserverData";

export const sanitizeOgcId = (value) =>
  String(value || "layer").replace(/[^a-zA-Z0-9_-]/g, "_");

export const getGeoServerPublicUrl = (layer) => {
  const url =
    layer?.geoserver_url ||
    import.meta.env.VITE_GEOSERVER_URL ||
    import.meta.env.VITE_GEOSERVER_PUBLIC_URL ||
    import.meta.env.VITE_BASE_URL_GEOSERVER ||
    "";

  const normalizedUrl = String(url).trim().replace(/\/+$/, "");
  if (!normalizedUrl) return "";

  const parsedUrl = new URL(normalizedUrl);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  if (!pathParts.length) {
    parsedUrl.pathname = "/geoserver";
  }

  return parsedUrl.toString().replace(/\/+$/, "");
};

export const getOgcWorkspace = (layer) => {
  const layerName = layer?.geoserver_layer || "";
  if (layerName.includes(":")) return layerName.split(":")[0];

  return layer?.workspace || import.meta.env.VITE_GEOSERVER_WORKSPACE || "kontum";
};

export const buildGeoServerWorkspaceUrl = (
  geoserverUrl,
  workspace,
  servicePath,
) => {
  const encodedWorkspace = encodeURIComponent(workspace);
  const lowerUrl = geoserverUrl.toLowerCase();
  const lowerWorkspace = String(workspace).toLowerCase();
  const lowerServicePath = String(servicePath).toLowerCase();
  const serviceSuffixes = new Set(["wms", "wfs", "wcs"]);

  if (lowerUrl.endsWith(`/${lowerServicePath}`)) return geoserverUrl;

  const parsedUrl = new URL(geoserverUrl);
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const lastPathPart = pathParts[pathParts.length - 1]?.toLowerCase();

  if (serviceSuffixes.has(lastPathPart)) {
    pathParts.pop();
  }

  if (pathParts[pathParts.length - 1]?.toLowerCase() !== lowerWorkspace) {
    pathParts.push(encodedWorkspace);
  }

  parsedUrl.pathname = `/${[...pathParts, servicePath].join("/")}`;
  parsedUrl.search = "";
  parsedUrl.hash = "";

  return parsedUrl.toString().replace(/\/+$/, "");
};

export const getOgcLayerName = (layer) =>
  layer?.geoserver_layer ||
  (layer?.table_name ? `${getOgcWorkspace(layer)}:${layer.table_name}` : "");

export const buildOgcSourceId = (layer) =>
  `ogc-src-${sanitizeOgcId(layer?.code || layer?.id || layer?.table_name)}`.slice(
    0,
    120,
  );

export const buildOgcRasterLayerId = (sourceId) => `ogc-${sourceId}-raster`;

export const buildOgcPointLayerIds = (sourceId) => ({
  cluster: `ogc-${sourceId}-cluster`,
  clusterCount: `ogc-${sourceId}-cluster-count`,
  pointHalo: `ogc-${sourceId}-point-halo`,
  point: `ogc-${sourceId}-point`,
});

export const getOgcGeometryPriority = (geometryType) => {
  const type = String(geometryType || "").toLowerCase();
  if (type.includes("point")) return GEOSERVER_LAYER_ORDER_PRIORITY.POINT;
  if (type.includes("line")) return GEOSERVER_LAYER_ORDER_PRIORITY.LINE;
  return GEOSERVER_LAYER_ORDER_PRIORITY.POLYGON;
};

export const isOgcPointGeometry = (geometryType) =>
  String(geometryType || "").toLowerCase().includes("point");

export const lngLatToWebMercator = ({ lng, lat }) => {
  const x = (lng * 20037508.34) / 180;
  const boundedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const y =
    Math.log(Math.tan(((90 + boundedLat) * Math.PI) / 360)) / (Math.PI / 180);

  return [x, (y * 20037508.34) / 180];
};
