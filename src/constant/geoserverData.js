export const GEOSERVER_SERVICE_TYPES = {
  WMS: "WMS",
  WFS: "WFS",
  WCS: "WCS",
  WMTS: "WMTS",
  TMS: "TMS",
  WMSC: "WMS-C",
};

export const GEOSERVER_SERVICE_VERSIONS = {
  [GEOSERVER_SERVICE_TYPES.WMS]: ["1.3.0", "1.1.1"],
  [GEOSERVER_SERVICE_TYPES.WFS]: ["2.0.0", "1.1.0", "1.0.0"],
  [GEOSERVER_SERVICE_TYPES.WCS]: ["2.0.1"],
  [GEOSERVER_SERVICE_TYPES.WMTS]: ["1.0.0"],
  [GEOSERVER_SERVICE_TYPES.TMS]: ["1.0.0"],
  [GEOSERVER_SERVICE_TYPES.WMSC]: ["1.1.1"],
};

export const GEOSERVER_DEFAULT_VERSIONS = {
  [GEOSERVER_SERVICE_TYPES.WMS]: "1.3.0",
  [GEOSERVER_SERVICE_TYPES.WFS]: "2.0.0",
  [GEOSERVER_SERVICE_TYPES.WCS]: "2.0.1",
  [GEOSERVER_SERVICE_TYPES.WMTS]: "1.0.0",
  [GEOSERVER_SERVICE_TYPES.TMS]: "1.0.0",
  [GEOSERVER_SERVICE_TYPES.WMSC]: "1.1.1",
};

export const GEOSERVER_OUTPUT_FORMATS = {
  WMS_IMAGE: "image/png",
  WMS_OPENLAYERS: "application/openlayers",
  WMS_FEATURE_INFO: "application/json",
  WFS_GEOJSON: "application/json",
  WCS_GEOTIFF: "image/tiff",
};

export const GEOSERVER_LAYER_ORDER_PRIORITY = {
  POLYGON: 0,
  LINE: 1,
  POINT: 2,
};

export const GEOSERVER_POINT_CLUSTER_OPTIONS = {
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50,
};

export const GEOSERVER_POINT_PAINT = {
  cluster: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#2563eb",
      20,
      "#0891b2",
      50,
      "#ea580c",
    ],
    "circle-radius": ["step", ["get", "point_count"], 16, 20, 20, 50, 24],
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 2,
    "circle-opacity": 0.9,
  },
  pointHalo: {
    "circle-radius": 9,
    "circle-color": "#ffffff",
    "circle-opacity": 0.86,
    "circle-stroke-color": "#0f766e",
    "circle-stroke-width": 1,
  },
  point: {
    "circle-radius": 5.5,
    "circle-color": "#0f766e",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1.5,
    "circle-opacity": 0.95,
  },
};
