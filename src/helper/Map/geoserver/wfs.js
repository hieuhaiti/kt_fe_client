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

// Mapbox GL supercluster (cluster: true) chỉ hoạt động với Point.
// Nếu backend WFS trả Multi* (do bảng PostGIS dùng type Multi*), tách thành
// các feature đơn để cluster + render đúng. Áp dụng cho cả Line/Polygon để
// dự phòng nếu sau này có branch WFS cho geometry non-point.
const MULTI_TO_SINGLE = {
  MultiPoint: "Point",
  MultiLineString: "LineString",
  MultiPolygon: "Polygon",
};

const explodeMultiFeatures = (features) => {
  const out = [];
  for (const f of features) {
    const g = f?.geometry;
    if (!g || !g.type) continue;
    const singleType = MULTI_TO_SINGLE[g.type];
    if (singleType && Array.isArray(g.coordinates) && g.coordinates.length > 0) {
      g.coordinates.forEach((coord, i) => {
        out.push({
          ...f,
          id: f.id != null ? `${f.id}__${i}` : undefined,
          geometry: { type: singleType, coordinates: coord },
        });
      });
    } else {
      out.push(f);
    }
  }
  return out;
};

export const fetchWfsGeoJson = async (layer, options) => {
  const url = buildWfsFeatureUrl(layer, options);
  if (!url) {
    return { type: "FeatureCollection", features: [] };
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GeoServer WFS ${response.status}`);
  }

  const data = await response.json();
  const rawFeatures =
    data?.type === "FeatureCollection"
      ? Array.isArray(data.features) ? data.features : []
      : Array.isArray(data?.features) ? data.features : [];

  return { type: "FeatureCollection", features: explodeMultiFeatures(rawFeatures) };
};
