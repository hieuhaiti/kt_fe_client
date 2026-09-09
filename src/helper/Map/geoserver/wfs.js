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

  if (bbox) {
    // GeoServer WFS 2.0.0 / 1.1.0: if bbox is minLng,minLat,maxLng,maxLat without CRS,
    // GeoServer uses srsName (EPSG:4326) which expects minLat,minLng,maxLat,maxLng!
    // Appending urn:ogc:def:crs:OGC:1.3:CRS84 forces GeoServer to treat bbox as minLng,minLat,maxLng,maxLat.
    const hasCrs =
      bbox.includes("urn:ogc") ||
      bbox.includes("EPSG:") ||
      bbox.includes("CRS");
    const formattedBbox = hasCrs
      ? bbox
      : `${bbox},urn:ogc:def:crs:OGC:1.3:CRS84`;
    params.set("bbox", formattedBbox);
  }

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

// [check style] TEMP import
import { checkStyleLog } from "@/lib/checkStyleDebug";

export const fetchWfsGeoJson = async (layer, options = {}) => {
  const { signal, ...requestOptions } = options;
  const url = buildWfsFeatureUrl(layer, requestOptions);
  if (!url) {
    return { type: "FeatureCollection", features: [] };
  }

  // [check style] TEMP log
  checkStyleLog("wfs.request", {
    layerCode: layer?.code,
    url,
    geoserver_layer: layer?.geoserver_layer,
  });

  const response = await fetch(url, { signal });
  if (!response.ok) {
    // [check style] TEMP log
    checkStyleLog("wfs.response.http_error", {
      layerCode: layer?.code,
      status: response.status,
      statusText: response.statusText,
    }, "warn");
    throw new Error(`GeoServer WFS ${response.status}`);
  }

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (parseErr) {
    // [check style] TEMP log: GeoServer trả về XML ExceptionReport thay vì JSON
    checkStyleLog("wfs.response.xml_exception", {
      layerCode: layer?.code,
      snippet: text.slice(0, 300),
    }, "warn");
    throw new Error(`GeoServer WFS XML: ${text.slice(0, 150)}`);
  }

  const rawFeatures =
    data?.type === "FeatureCollection"
      ? Array.isArray(data.features) ? data.features : []
      : Array.isArray(data?.features) ? data.features : [];

  const exploded = explodeMultiFeatures(rawFeatures);

  // [check style] TEMP log
  checkStyleLog("wfs.response.success", {
    layerCode: layer?.code,
    rawCount: rawFeatures.length,
    explodedCount: exploded.length,
  });

  return { type: "FeatureCollection", features: exploded };
};
