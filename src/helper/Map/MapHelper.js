import { defaultLatLong, defaultZoom } from "@/constant/mapData";
import {
  GEOSERVER_POINT_CLUSTER_OPTIONS,
  GEOSERVER_POINT_PAINT,
} from "@/constant/geoserverData";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { praseLink } from "@/lib/utils";
import {
  buildOgcPointLayerIds,
  buildOgcRasterLayerId,
  buildOgcSourceId as buildGeoServerSourceId,
  buildWmsFeatureInfoUrl,
  buildWmsTileUrl,
  fetchWfsGeoJson,
  getOgcGeometryPriority,
  getOgcLayerName,
  isOgcPointGeometry,
} from "@/helper/Map/geoserver";

// Helper function to calculate bounds from coordinates
export const getBounds = (coordinates) => {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;

  coordinates.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  });

  return { minLng, minLat, maxLng, maxLat };
};

export const resetViewPort = (map, currentTerrainState, duration = 5000) => {
  if (!map) return;
  map.flyTo({
    center: [defaultLatLong.lng, defaultLatLong.lat],
    zoom: defaultZoom,
    pitch: currentTerrainState ? 70 : 0,
    bearing: 0,
    duration: duration,
    essential: true,
  });
};

// =====================================================================
// Initialize MapboxDraw
export const initializeDraw = (map, onCreate, onUpdate, onDelete) => {
  const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      line_string: true,
      polygon: true,
      trash: true,
    },
    styles: [
      // Polygon fill - inactive
      {
        id: "gl-draw-polygon-fill-inactive",
        type: "fill",
        filter: [
          "all",
          ["==", "active", "false"],
          ["==", "$type", "Polygon"],
          ["!=", "mode", "static"],
        ],
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.2,
        },
      },
      // Polygon fill - active (selected)
      {
        id: "gl-draw-polygon-fill-active",
        type: "fill",
        filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
        paint: {
          "fill-color": "#10b981",
          "fill-opacity": 0.3,
        },
      },
      // Polygon stroke - inactive
      {
        id: "gl-draw-polygon-stroke-inactive",
        type: "line",
        filter: [
          "all",
          ["==", "active", "false"],
          ["==", "$type", "Polygon"],
          ["!=", "mode", "static"],
        ],
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
        },
      },
      // Polygon stroke - active (selected)
      {
        id: "gl-draw-polygon-stroke-active",
        type: "line",
        filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#10b981",
          "line-width": 3,
        },
      },
      // LineString - inactive
      {
        id: "gl-draw-line-inactive",
        type: "line",
        filter: [
          "all",
          ["==", "active", "false"],
          ["==", "$type", "LineString"],
          ["!=", "mode", "static"],
        ],
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#f97316",
          "line-width": 2,
          "line-dasharray": [4, 4],
        },
      },
      // LineString - active (selected)
      {
        id: "gl-draw-line-active",
        type: "line",
        filter: [
          "all",
          ["==", "active", "true"],
          ["==", "$type", "LineString"],
        ],
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ec4899",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      },
      // Midpoint circles
      {
        id: "gl-draw-polygon-midpoint",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
        paint: {
          "circle-radius": 4,
          "circle-color": "#fbbf24",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
        },
      },
      // Vertex points - inactive
      {
        id: "gl-draw-point-inactive",
        type: "circle",
        filter: [
          "all",
          ["==", "active", "false"],
          ["==", "$type", "Point"],
          ["!=", "meta", "midpoint"],
        ],
        paint: {
          "circle-radius": 5,
          "circle-color": "#f97316",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.5,
        },
      },
      // Vertex points - active (selected)
      {
        id: "gl-draw-point-active",
        type: "circle",
        filter: [
          "all",
          ["==", "active", "true"],
          ["==", "$type", "Point"],
          ["!=", "meta", "midpoint"],
        ],
        paint: {
          "circle-radius": 6,
          "circle-color": "#ec4899",
          "circle-stroke-color": "#FF0000",
          "circle-stroke-width": 4,
        },
      },
      // Vertex points for polygons/lines being edited
      {
        id: "gl-draw-polygon-and-line-vertex-active",
        type: "circle",
        filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#10b981",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      },
    ],
  });

  map.addControl(draw, "bottom-right");

  map.on("draw.create", onCreate);
  map.on("draw.update", onUpdate);
  map.on("draw.delete", onDelete);

  return draw;
};

// handle draw events: create, update, delete
export const createDrawHandlers = (drawRef, updateMeasurements) => {
  const handleDrawCreate = () => {
    if (!drawRef.current) return;
    const data = drawRef.current.getAll();
    if (data.features.length > 0) {
      updateMeasurements(data.features);
    }
  };

  const handleDrawUpdate = () => {
    if (!drawRef.current) return;
    const data = drawRef.current.getAll();
    updateMeasurements(data.features);
  };

  const handleDrawDelete = () => {
    if (!drawRef.current) return;
    const data = drawRef.current.getAll();
    updateMeasurements(data.features);
  };

  return {
    handleDrawCreate,
    handleDrawUpdate,
    handleDrawDelete,
  };
};
// =====================================================================

// =====================================================================
// Helper function để update 3D terrain
export function update3DTerrain(map, terrainState) {
  if (!map || !map.getStyle()) return;

  try {
    const targetPitch = terrainState ? 75 : 0;

    if (terrainState) {
      // Enable terrain
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.terrain-rgb",
          tileSize: 512,
          maxzoom: 14,
        });
      }

      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

      if (!map.getLayer("sky")) {
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 15,
          },
        });
      }

      map.stop();
      map.easeTo({
        pitch: targetPitch,
        bearing: 0,
        duration: 1200,
        essential: true,
      });
    } else {
      // Disable terrain - force tắt dù style có bật sẵn
      map.setTerrain(null);

      if (map.getLayer("sky")) {
        map.removeLayer("sky");
      }

      map.stop();
      map.easeTo({ pitch: targetPitch, duration: 1000, essential: true });

      map.once("idle", () => {
        try {
          if (map.getTerrain && map.getTerrain()) {
            map.setTerrain(null);
          }
        } catch {
          // Ignore transient terrain state while Mapbox finishes style changes.
        }
      });
    }
  } catch (error) {
    console.warn("Terrain update warning:", error.message);
  }
}

// Helper function để update 3D buildings
export function update3DBuildings(map, terrainState) {
  if (!map || !map.getStyle()) return;

  try {
    if (terrainState) {
      if (!map.getLayer("3d-buildings")) {
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
          (layer) => layer.type === "symbol" && layer.layout["text-field"],
        )?.id;

        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#aaa",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.6,
            },
          },
          labelLayerId,
        );
      }
    } else {
      if (map.getLayer("3d-buildings")) {
        map.removeLayer("3d-buildings");
      }
    }
  } catch (error) {
    // Silently handle errors during style transitions
    console.warn("Buildings update warning:", error.message);
  }
}
// =====================================================================

// =====================================================================
// Hàm hỗ trợ layer dữ liệu (Data Layers)
// =====================================================================

/**
 * Xác định loại geometry từ dữ liệu API
 * @param {string} geometryType - geometry_type từ API ("point", "polygon", "line")
 * @returns {"circle"|"fill"|"line"}
 */
function getMapLayerType(geometryType) {
  if (!geometryType) return "circle";
  const type = geometryType.toLowerCase();
  if (type.includes("polygon")) return "fill";
  if (type.includes("line")) return "line";
  return "circle";
}

/**
 * Tạo GeoJSON Feature từ dữ liệu map layer API
 * @param {Object} mapLayer - Dữ liệu map layer từ API
 * @returns {Object} GeoJSON Feature
 */
function mapLayerToGeoJSONFeature(mapLayer) {
  return {
    id: mapLayer.id,
    type: "Feature",
    properties: {
      id: mapLayer.id,
      name: mapLayer.name,
      category: mapLayer.category,
      ...(mapLayer.properties || {}),
    },
    geometry: mapLayer.geometry_data,
  };
}

/**
 * Chuyển danh sách map layers thành GeoJSON FeatureCollection
 * @param {Array} mapLayers - Mảng dữ liệu map layers từ API
 * @returns {Object} GeoJSON FeatureCollection
 */
export function mapLayersToGeoJSON(mapLayers) {
  if (!mapLayers || mapLayers.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }
  return {
    type: "FeatureCollection",
    features: mapLayers
      .filter((l) => l.geometry_data)
      .map(mapLayerToGeoJSONFeature),
  };
}

/**
 * Thêm hoặc cập nhật lớp dữ liệu category lên map
 * Hỗ trợ Point, LineString, Polygon (và Multi- variants)
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {string} sourceId - ID duy nhất cho source (ví dụ: "category-2")
 * @param {Object} geojson - GeoJSON FeatureCollection
 * @param {string} geometryType - "point" | "line" | "polygon"
 * @param {string} [color="#3b82f6"] - Màu hiển thị
 * @param {boolean} [visible=true] - Hiển thị/ẩn
 */
/**
 * Kiểm tra xem chuỗi là URL file hay SVG inline markup.
 * @param {string} value
 * @returns {boolean}
 */
function isIconUrl(value) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../")
  );
}

/**
 * Lấy nội dung SVG: nếu là URL thì fetch, nếu là markup thì trả về nguyên.
 * @param {string} icon - URL hoặc SVG markup string
 * @returns {Promise<string>}
 */
const resolveSvgContent = async (icon) => {
  if (!icon) return "";
  if (isIconUrl(icon)) {
    const fullUrl = praseLink(icon);
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(`Không thể tải SVG: ${fullUrl}`);
    return res.text();
  }
  return icon;
};

/**
 * Tạo HTMLImageElement từ SVG string để dùng làm marker trên Mapbox
 * @param {string} svgString - Chuỗi SVG markup
 * @param {string} color - Màu stroke cho SVG
 * @param {number} [size=32] - Kích thước icon (px)
 * @returns {Promise<HTMLImageElement>}
 */
const svgStringToImage = (svgString, color = "#3b82f6", size = 32) => {
  return new Promise((resolve, reject) => {
    // Thay currentColor bằng màu thực tế
    let svg = svgString.replace(/currentColor/g, color);
    // Cập nhật width/height
    svg = svg.replace(/width="\d+"/, `width="${size}"`);
    svg = svg.replace(/height="\d+"/, `height="${size}"`);

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image(size, size);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
};

/**
 * Trả về beforeId để chèn layer đúng thứ tự:
 * polygon fill → polygon outline → line → point/label/cluster (trên cùng)
 * @param {mapboxgl.Map} map
 * @param {"fill"|"outline"|"line"|"point"} priority
 * @returns {string|undefined}
 */
function getCategoryLayerBeforeId(map, priority) {
  // Thứ tự: fill → outline → line → point/label/cluster
  // Chỉ tìm trong các category layers có prefix "cat-"
  const layers = map.getStyle()?.layers ?? [];
  const catLayers = layers.filter((l) => l.id.startsWith("cat-"));

  const lookup = {
    // fill đứng trước tất cả cat- layers khác
    fill: [
      "-outline",
      "-line",
      "-point",
      "-label",
      "-cluster",
      "-cluster-count",
    ],
    // outline đứng trước line, point, label, cluster
    outline: ["-line", "-point", "-label", "-cluster", "-cluster-count"],
    // line đứng trước point, label, cluster
    line: ["-point", "-label", "-cluster", "-cluster-count"],
    // point/label/cluster đứng trên cùng
    point: [],
  };

  const suffixes = lookup[priority] ?? [];
  if (!suffixes.length) return undefined;

  return catLayers.find((l) => suffixes.some((s) => l.id.endsWith(s)))?.id;
}

export const addOrUpdateCategoryLayer = async (
  map,
  sourceId,
  geojson,
  geometryType,
  color = "#3b82f6",
  visible = true,
  icon = "",
) => {
  const layerType = getMapLayerType(geometryType);
  const visibility = visible ? "visible" : "none";
  // Prefix "cat-" để nhận diện category layers (phân biệt với satellite/raster layers)
  const L = (s) => `cat-${sourceId}-${s}`;

  try {
    // Thêm hoặc cập nhật source
    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(geojson);
    } else {
      // Point layers dùng clustering
      if (layerType === "circle") {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });
      }
    }

    if (layerType === "circle") {
      // ─── Point Layer (unclustered only) ──────────────────
      const iconImageId = L("icon");
      const unclusteredFilter = ["!", ["has", "point_count"]];

      // Nếu có icon SVG (URL file hoặc markup) → dùng symbol layer thay vì circle
      if (icon) {
        // Đăng ký icon image nếu chưa có
        if (!map.hasImage(iconImageId)) {
          try {
            const svgContent = await resolveSvgContent(icon);
            const img = await svgStringToImage(svgContent, color, 32);
            map.addImage(iconImageId, img, { sdf: false });
          } catch (err) {
            console.warn("Lỗi tạo SVG icon, fallback circle:", err);
          }
        }

        // Dùng symbol layer nếu icon đã load thành công
        if (map.hasImage(iconImageId)) {
          // Nền trắng hình tròn phía sau icon
          if (!map.getLayer(L("point-bg"))) {
            map.addLayer({
              id: L("point-bg"),
              type: "circle",
              source: sourceId,
              filter: unclusteredFilter,
              layout: { visibility },
              paint: {
                "circle-radius": 12,
                "circle-color": "#ffffff",
                "circle-stroke-width": 1.5,
                "circle-stroke-color": color,
                "circle-opacity": 0.7,
              },
            });
          } else {
            map.setLayoutProperty(L("point-bg"), "visibility", visibility);
          }

          if (!map.getLayer(L("point"))) {
            map.addLayer({
              id: L("point"),
              type: "symbol",
              source: sourceId,
              filter: unclusteredFilter,
              layout: {
                "icon-image": iconImageId,
                "icon-size": 0.5,
                "icon-allow-overlap": true,
                "icon-anchor": "center",
                visibility,
              },
            });
          } else {
            map.setLayoutProperty(L("point"), "visibility", visibility);
          }
        } else {
          // Fallback: circle layer
          if (!map.getLayer(L("point"))) {
            map.addLayer({
              id: L("point"),
              type: "circle",
              source: sourceId,
              filter: unclusteredFilter,
              layout: { visibility },
              paint: {
                "circle-radius": 6,
                "circle-color": color,
                "circle-opacity": 0.85,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#F2F2F2",
              },
            });
          } else {
            map.setLayoutProperty(L("point"), "visibility", visibility);
          }
        }
      } else {
        // Không có icon → circle layer như cũ
        if (!map.getLayer(L("point"))) {
          map.addLayer({
            id: L("point"),
            type: "circle",
            source: sourceId,
            filter: unclusteredFilter,
            layout: { visibility },
            paint: {
              "circle-radius": 6,
              "circle-color": color,
              "circle-opacity": 0.85,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#F2F2F2",
            },
          });
        } else {
          map.setLayoutProperty(L("point"), "visibility", visibility);
        }
      }

      // Label (unclustered only)
      if (!map.getLayer(L("label"))) {
        map.addLayer({
          id: L("label"),
          type: "symbol",
          source: sourceId,
          filter: unclusteredFilter,
          layout: {
            "text-field": ["get", "name"],
            "text-size": 11,
            "text-offset": [0, 1.5],
            "text-anchor": "top",
            visibility,
          },
          paint: {
            "text-color": color,
            "text-halo-color": "#F2F2F2",
            "text-halo-width": 1,
          },
        });
      } else {
        map.setLayoutProperty(L("label"), "visibility", visibility);
      }

      // ─── Cluster circle ───────────────────────────────────
      if (!map.getLayer(L("cluster"))) {
        map.addLayer({
          id: L("cluster"),
          type: "circle",
          source: sourceId,
          filter: ["has", "point_count"],
          layout: { visibility },
          paint: {
            "circle-color": color,
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              10,
              24,
              30,
              32,
              50,
              40,
            ],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#F2F2F2",
            "circle-opacity": 0.85,
          },
        });

        // Cluster expansion click (map logic → xử lý ở helper)
        map.on("click", L("cluster"), (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [L("cluster")],
          });
          if (!features.length) return;
          const clusterId = features[0].properties.cluster_id;
          map
            .getSource(sourceId)
            .getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              map.easeTo({
                center: features[0].geometry.coordinates,
                zoom,
              });
            });
        });

        map.on("mouseenter", L("cluster"), () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", L("cluster"), () => {
          map.getCanvas().style.cursor = "";
        });
      } else {
        map.setLayoutProperty(L("cluster"), "visibility", visibility);
      }

      // ─── Cluster count label ──────────────────────────────
      if (!map.getLayer(L("cluster-count"))) {
        map.addLayer({
          id: L("cluster-count"),
          type: "symbol",
          source: sourceId,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count"],
            "text-size": 14,
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            visibility,
          },
          paint: {
            "text-color": "#F2F2F2",
            "text-halo-color": "rgba(0,0,0,0.2)",
            "text-halo-width": 1,
          },
        });
      } else {
        map.setLayoutProperty(L("cluster-count"), "visibility", visibility);
      }
    } else if (layerType === "line") {
      // ─── Line Layer ──────────────────────────────────────
      if (!map.getLayer(L("line"))) {
        map.addLayer(
          {
            id: L("line"),
            type: "line",
            source: sourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
              visibility,
            },
            paint: {
              "line-color": color,
              "line-width": 2.5,
              "line-opacity": 0.8,
            },
          },
          getCategoryLayerBeforeId(map, "line"),
        );
      } else {
        map.setLayoutProperty(L("line"), "visibility", visibility);
      }
    } else {
      // ─── Polygon Fill Layer ──────────────────────────────
      if (!map.getLayer(L("fill"))) {
        map.addLayer(
          {
            id: L("fill"),
            type: "fill",
            source: sourceId,
            layout: { visibility },
            paint: {
              "fill-color": color,
              "fill-opacity": 0.2,
            },
          },
          getCategoryLayerBeforeId(map, "fill"),
        );
      } else {
        map.setLayoutProperty(L("fill"), "visibility", visibility);
      }

      // Polygon Outline
      if (!map.getLayer(L("outline"))) {
        map.addLayer(
          {
            id: L("outline"),
            type: "line",
            source: sourceId,
            layout: { visibility },
            paint: {
              "line-color": color,
              "line-width": 1.5,
              "line-opacity": 0.7,
            },
          },
          getCategoryLayerBeforeId(map, "outline"),
        );
      } else {
        map.setLayoutProperty(L("outline"), "visibility", visibility);
      }
    }
  } catch (error) {
    console.warn("Lỗi khi thêm/cập nhật category layer:", error.message);
  }
};

/**
 * Xóa lớp dữ liệu category khỏi map
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {string} sourceId - ID source cần xóa
 */
export const removeCategoryLayer = (map, sourceId) => {
  if (!map || !sourceId) return;

  const suffixes = [
    "point-bg",
    "point",
    "label",
    "cluster",
    "cluster-count",
    "line",
    "fill",
    "outline",
  ];

  try {
    suffixes.forEach((suffix) => {
      const layerId = `cat-${sourceId}-${suffix}`;
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Xóa custom icon image nếu có
    const iconImageId = `cat-${sourceId}-icon`;
    if (map.hasImage(iconImageId)) {
      map.removeImage(iconImageId);
    }
  } catch (error) {
    console.warn("Lỗi khi xóa category layer:", error.message);
  }
};

/**
 * Bật/tắt hiển thị lớp dữ liệu category
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {string} sourceId - ID source
 * @param {boolean} visible - true = hiển thị, false = ẩn
 */
export const toggleCategoryLayerVisibility = (map, sourceId, visible) => {
  if (!map || !sourceId) return;

  const suffixes = [
    "point-bg",
    "point",
    "label",
    "cluster",
    "cluster-count",
    "line",
    "fill",
    "outline",
  ];
  const visibility = visible ? "visible" : "none";

  try {
    suffixes.forEach((suffix) => {
      const layerId = `cat-${sourceId}-${suffix}`;
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visibility);
      }
    });
  } catch (error) {
    console.warn("Lỗi khi toggle category layer:", error.message);
  }
};

// =====================================================================
// Highlight Layers - Hỗ trợ Point, Line, Polygon
// =====================================================================

const HIGHLIGHT_SOURCE = "highlight-source";
const HIGHLIGHT_LAYERS = [
  "highlight-point-glow",
  "highlight-point-pulse",
  "highlight-line",
  "highlight-fill",
  "highlight-outline",
];

/**
 * Highlight một đối tượng trên map (Point, Line, hoặc Polygon)
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {Object} geojsonFeature - GeoJSON Feature hoặc { coordinates, geometry_data, geometry_type }
 */
export const highlightFeatureOnMap = (map, geojsonFeature) => {
  if (!map || !geojsonFeature) return;

  try {
    // Xóa highlight cũ nếu có
    clearHighlightFromMap(map);

    // Chuẩn hóa input thành GeoJSON Feature
    let feature;
    if (geojsonFeature.type === "Feature") {
      feature = geojsonFeature;
    } else if (geojsonFeature.geometry_data) {
      feature = {
        type: "Feature",
        properties: geojsonFeature.properties || {},
        geometry: geojsonFeature.geometry_data,
      };
    } else if (geojsonFeature.coordinates) {
      feature = {
        type: "Feature",
        properties: geojsonFeature.properties || {},
        geometry: {
          type: "Point",
          coordinates: geojsonFeature.coordinates,
        },
      };
    } else {
      console.warn("Dữ liệu highlight không hợp lệ");
      return;
    }

    // Thêm source
    map.addSource(HIGHLIGHT_SOURCE, {
      type: "geojson",
      data: feature,
    });

    const geomType = feature.geometry?.type || "";

    if (geomType === "Point" || geomType === "MultiPoint") {
      // ─── Highlight Point ──────────────────────────────────
      map.addLayer({
        id: "highlight-point-glow",
        type: "circle",
        source: HIGHLIGHT_SOURCE,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            20,
            15,
            35,
            20,
            50,
          ],
          "circle-color": "#FF6B6B",
          "circle-opacity": 0.3,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FF6B6B",
          "circle-stroke-opacity": 0.8,
        },
      });

      map.addLayer({
        id: "highlight-point-pulse",
        type: "circle",
        source: HIGHLIGHT_SOURCE,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            15,
            15,
            25,
            20,
            35,
          ],
          "circle-color": "#FF6B6B",
          "circle-opacity": 0.5,
        },
      });
    } else if (geomType === "LineString" || geomType === "MultiLineString") {
      // ─── Highlight Line ───────────────────────────────────
      map.addLayer({
        id: "highlight-line",
        type: "line",
        source: HIGHLIGHT_SOURCE,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#FF6B6B",
          "line-width": 5,
          "line-opacity": 0.8,
        },
      });
    } else if (geomType === "Polygon" || geomType === "MultiPolygon") {
      // ─── Highlight Polygon ────────────────────────────────
      map.addLayer({
        id: "highlight-fill",
        type: "fill",
        source: HIGHLIGHT_SOURCE,
        paint: {
          "fill-color": "#FF6B6B",
          "fill-opacity": 0.25,
        },
      });

      map.addLayer({
        id: "highlight-outline",
        type: "line",
        source: HIGHLIGHT_SOURCE,
        paint: {
          "line-color": "#FF6B6B",
          "line-width": 3,
          "line-opacity": 0.9,
        },
      });
    }

    // Bay đến đối tượng được highlight
    flyToFeature(map, feature);
  } catch (error) {
    console.warn("Lỗi khi highlight feature:", error.message);
  }
};

/**
 * Bay camera đến GeoJSON Feature (hỗ trợ Point, Line, Polygon)
 * @param {mapboxgl.Map} map
 * @param {Object} feature - GeoJSON Feature
 */
export function flyToFeature(map, feature) {
  if (!map || !feature?.geometry) return;

  const geomType = feature.geometry.type;

  if (geomType === "Point") {
    map.flyTo({
      center: feature.geometry.coordinates,
      zoom: Math.max(map.getZoom(), 15),
      essential: true,
      duration: 2000,
    });
  } else {
    // Tính bounds cho Line/Polygon
    const coords = extractAllCoordinates(feature.geometry);
    if (coords.length === 0) return;

    const bounds = coords.reduce(
      (b, [lng, lat]) => {
        b[0][0] = Math.min(b[0][0], lng);
        b[0][1] = Math.min(b[0][1], lat);
        b[1][0] = Math.max(b[1][0], lng);
        b[1][1] = Math.max(b[1][1], lat);
        return b;
      },
      [
        [Infinity, Infinity],
        [-Infinity, -Infinity],
      ],
    );

    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 16,
      duration: 2000,
    });
  }
}

/**
 * Trích xuất tất cả tọa độ từ geometry (hỗ trợ mọi loại)
 * @param {Object} geometry - GeoJSON Geometry
 * @returns {Array<[number, number]>}
 */
function extractAllCoordinates(geometry) {
  if (!geometry || !geometry.coordinates) return [];

  switch (geometry.type) {
    case "Point":
      return [geometry.coordinates];
    case "MultiPoint":
    case "LineString":
      return geometry.coordinates;
    case "MultiLineString":
    case "Polygon":
      return geometry.coordinates.flat();
    case "MultiPolygon":
      return geometry.coordinates.flat(2);
    default:
      return [];
  }
}

/**
 * Xóa highlight khỏi map
 * @param {mapboxgl.Map} map - Mapbox map instance
 */
export const clearHighlightFromMap = (map) => {
  if (!map) return;

  try {
    HIGHLIGHT_LAYERS.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    if (map.getSource(HIGHLIGHT_SOURCE)) {
      map.removeSource(HIGHLIGHT_SOURCE);
    }
  } catch (error) {
    console.warn("Lỗi khi xóa highlight:", error.message);
  }
};
// =====================================================================
// Buffer Analysis Layers - Giám sát & Cảnh báo
// =====================================================================

/**
 * Thêm hoặc cập nhật lớp vùng đệm buffer
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {Object} bufferGeoJSON - GeoJSON Polygon
 * @param {boolean} [visible=true] - Hiển thị/ẩn layer
 */
export const addOrUpdateBufferLayer = (map, bufferGeoJSON, visible = true) => {
  if (!map || !bufferGeoJSON) return;

  const sourceId = "buffer-zone-source";
  const layerId = "buffer-zone-layer";
  const outlineLayerId = "buffer-zone-outline";

  try {
    // Add or update source
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: bufferGeoJSON,
      });
    } else {
      map.getSource(sourceId).setData(bufferGeoJSON);
    }

    // Add fill layer (semi-transparent)
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        layout: {
          visibility: visible ? "visible" : "none",
        },
        paint: {
          "fill-color": "#EA580C",
          "fill-opacity": 0.2,
        },
      });
    } else {
      map.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none",
      );
    }

    // Add outline layer (border)
    if (!map.getLayer(outlineLayerId)) {
      map.addLayer({
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: visible ? "visible" : "none",
        },
        paint: {
          "line-color": "#EA580C", // Orange
          "line-width": 1.5,
          "line-opacity": 0.5,
        },
      });
    } else {
      map.setLayoutProperty(
        outlineLayerId,
        "visibility",
        visible ? "visible" : "none",
      );
    }
  } catch (error) {
    console.warn("Error adding buffer layer:", error.message);
  }
};

// =====================================================================
// Satellite Layers - Raster tiles (Mapbox)
// =====================================================================
const sanitizeSatelliteId = (value) => {
  if (!value) return "unknown";
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "_");
};

export const buildSatelliteSourceId = (mapId, layerId) => {
  const mapPart = sanitizeSatelliteId(mapId || "map");
  const layerPart = sanitizeSatelliteId(layerId || "layer");
  return `satellite-src-${layerPart}-${mapPart}`.slice(0, 120);
};

/**
 * Trả về beforeId để chèn raster layer xuống dưới mọi category layer
 * Thứ tự: raster → polygon fill → polygon outline → line → point/label/cluster
 * @param {mapboxgl.Map} map
 * @returns {string|undefined}
 */
function getRasterBeforeId(map) {
  // Raster phải nằm dưới tất cả category layers (cat- prefix)
  const layers = map.getStyle()?.layers ?? [];
  return layers.find((l) => l.id.startsWith("cat-"))?.id;
}

const getOgcLayerBeforeId = (map, geometryType, currentLayerId) => {
  const priority = getOgcGeometryPriority(geometryType);
  const layers = map.getStyle()?.layers ?? [];
  const ogcBeforeId = layers.find((item) => {
    if (!item.id.startsWith("ogc-") || item.id === currentLayerId) return false;
    const itemPriority =
      typeof item.metadata?.ktGeometryPriority === "number"
        ? item.metadata.ktGeometryPriority
        : 0;

    return itemPriority > priority;
  })?.id;

  return ogcBeforeId || getRasterBeforeId(map);
};

export const buildOgcSourceId = (layer) =>
  buildGeoServerSourceId(layer);

export const buildOgcLayerId = (sourceId) => buildOgcRasterLayerId(sourceId);

export { buildOgcPointLayerIds, isOgcPointGeometry };

export const buildOgcWmsTileUrl = (layer) => buildWmsTileUrl(layer);

export const buildOgcFeatureInfoUrl = (map, layer, point) =>
  buildWmsFeatureInfoUrl(map, layer, point);

const moveLayerIfNeeded = (map, layerId, beforeId) => {
  if (beforeId && beforeId !== layerId && map.getLayer(layerId)) {
    map.moveLayer(layerId, beforeId);
  }
};

const addOrUpdateGeoServerPointLayer = async (
  map,
  sourceId,
  layer,
  visible = true,
) => {
  const ogcLayerName = getOgcLayerName(layer);
  if (!map || !sourceId || !ogcLayerName) return;

  const visibility = visible ? "visible" : "none";
  const ids = buildOgcPointLayerIds(sourceId);

  try {
    const geojson = await fetchWfsGeoJson(layer);
    if (!map.getStyle()) return;

    const existingSource = map.getSource(sourceId);
    if (existingSource?.setData) {
      existingSource.setData(geojson);
    } else if (!existingSource) {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojson,
        ...GEOSERVER_POINT_CLUSTER_OPTIONS,
      });
    }

    const beforeId = getOgcLayerBeforeId(map, layer?.geometry_type, ids.cluster);
    const metadata = {
      ktGeometryPriority: getOgcGeometryPriority(layer?.geometry_type),
      ktGeometryType: layer?.geometry_type || null,
      ktLayerCode: layer?.code || null,
      ktOgcPointLayer: true,
    };

    if (!map.getLayer(ids.cluster)) {
      map.addLayer(
        {
          id: ids.cluster,
          type: "circle",
          source: sourceId,
          filter: ["has", "point_count"],
          metadata,
          layout: { visibility },
          paint: GEOSERVER_POINT_PAINT.cluster,
        },
        beforeId,
      );
    } else {
      map.setLayoutProperty(ids.cluster, "visibility", visibility);
      moveLayerIfNeeded(map, ids.cluster, beforeId);
    }

    if (!map.getLayer(ids.clusterCount)) {
      map.addLayer(
        {
          id: ids.clusterCount,
          type: "symbol",
          source: sourceId,
          filter: ["has", "point_count"],
          metadata,
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
            visibility,
          },
          paint: { "text-color": "#ffffff" },
        },
        beforeId,
      );
    } else {
      map.setLayoutProperty(ids.clusterCount, "visibility", visibility);
      moveLayerIfNeeded(map, ids.clusterCount, beforeId);
    }

    if (!map.getLayer(ids.pointHalo)) {
      map.addLayer(
        {
          id: ids.pointHalo,
          type: "circle",
          source: sourceId,
          filter: ["!", ["has", "point_count"]],
          metadata,
          layout: { visibility },
          paint: GEOSERVER_POINT_PAINT.pointHalo,
        },
        beforeId,
      );
    } else {
      map.setLayoutProperty(ids.pointHalo, "visibility", visibility);
      moveLayerIfNeeded(map, ids.pointHalo, beforeId);
    }

    if (!map.getLayer(ids.point)) {
      map.addLayer(
        {
          id: ids.point,
          type: "circle",
          source: sourceId,
          filter: ["!", ["has", "point_count"]],
          metadata,
          layout: { visibility },
          paint: GEOSERVER_POINT_PAINT.point,
        },
        beforeId,
      );
    } else {
      map.setLayoutProperty(ids.point, "visibility", visibility);
      moveLayerIfNeeded(map, ids.point, beforeId);
    }
  } catch (error) {
    console.warn("Loi khi them/cap nhat OGC point layer:", error.message);
  }
};

const addOrUpdateGeoServerWmsLayer = (
  map,
  sourceId,
  layer,
  visible = true,
) => {
  const tileUrl = buildOgcWmsTileUrl(layer);
  const ogcLayerName = getOgcLayerName(layer);
  if (!map || !sourceId || !ogcLayerName || !tileUrl) {
    return;
  }

  const mapLayerId = buildOgcLayerId(sourceId);
  const opacity =
    typeof layer?.default_style?.opacity === "number"
      ? layer.default_style.opacity
      : 0.72;

  try {
    const beforeId = getOgcLayerBeforeId(
      map,
      layer?.geometry_type,
      mapLayerId,
    );

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        minzoom: layer?.min_zoom ?? 0,
        maxzoom: layer?.max_zoom ?? 22,
        attribution: "GeoServer",
      });
    }

    if (map.getLayer(mapLayerId)) {
      map.setLayoutProperty(
        mapLayerId,
        "visibility",
        visible ? "visible" : "none",
      );
      map.setPaintProperty(
        mapLayerId,
        "raster-opacity",
        Math.max(0, Math.min(1, opacity)),
      );
      moveLayerIfNeeded(map, mapLayerId, beforeId);
      return;
    }

    map.addLayer(
      {
        id: mapLayerId,
        type: "raster",
        source: sourceId,
        metadata: {
          ktGeometryPriority: getOgcGeometryPriority(layer?.geometry_type),
          ktGeometryType: layer?.geometry_type || null,
          ktLayerCode: layer?.code || null,
        },
        layout: { visibility: visible ? "visible" : "none" },
        paint: {
          "raster-opacity": Math.max(0, Math.min(1, opacity)),
          "raster-fade-duration": 250,
        },
      },
      beforeId,
    );
  } catch (error) {
    console.warn("Lỗi khi thêm/cập nhật OGC layer:", error.message);
  }
};

export const addOrUpdateGeoServerLayer = async (
  map,
  sourceId,
  layer,
  visible = true,
) => {
  if (isOgcPointGeometry(layer?.geometry_type)) {
    await addOrUpdateGeoServerPointLayer(map, sourceId, layer, visible);
    return;
  }

  addOrUpdateGeoServerWmsLayer(map, sourceId, layer, visible);
};

export const removeGeoServerLayer = (map, sourceId) => {
  if (!map || !sourceId) return;

  try {
    const mapLayerId = buildOgcLayerId(sourceId);
    const pointLayerIds = buildOgcPointLayerIds(sourceId);

    [
      pointLayerIds.point,
      pointLayerIds.pointHalo,
      pointLayerIds.clusterCount,
      pointLayerIds.cluster,
      mapLayerId,
    ].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  } catch (error) {
    console.warn("Lỗi khi xóa OGC layer:", error.message);
  }
};

export const addOrUpdateOgcWmsLayer = addOrUpdateGeoServerLayer;
export const removeOgcWmsLayer = removeGeoServerLayer;

export const addSatelliteLayerToMap = (
  map,
  layerData,
  layerId,
  opacity = 1,
  sourceIdOverride,
) => {
  if (!map) {
    console.error("[addSatelliteLayerToMap] Map is null/undefined");
    return null;
  }

  if (!layerData?.tileUrl) {
    console.error(
      "[addSatelliteLayerToMap] Missing tileUrl in layerData:",
      layerData,
    );
    return null;
  }

  if (!layerId) {
    console.error("[addSatelliteLayerToMap] Missing layerId");
    return null;
  }

  const sourceId =
    sourceIdOverride || buildSatelliteSourceId(layerData.mapId, layerId);

  try {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    map.addSource(sourceId, {
      type: "raster",
      tiles: [layerData.tileUrl],
      tileSize: 256,
      attribution: "Google Earth Engine",
    });

    map.addLayer(
      {
        id: layerId,
        type: "raster",
        source: sourceId,
        paint: {
          "raster-opacity": opacity,
        },
      },
      getRasterBeforeId(map),
    );

    return sourceId;
  } catch (error) {
    console.error(
      `[addSatelliteLayerToMap] Error adding satellite layer ${layerId}:`,
      error.message,
      error,
    );
    return null;
  }
};

export const removeSatelliteLayerFromMap = (map, layerId, sourceId) => {
  if (!map) {
    console.error("[removeSatelliteLayerFromMap] Map is null/undefined");
    return;
  }

  try {
    if (layerId && map.getLayer(layerId)) {
      map.removeLayer(layerId);
    } else if (layerId) {
      console.warn(`Layer not found on map, skipping: ${layerId}`);
    }
  } catch (error) {
    console.error(
      "[removeSatelliteLayerFromMap] Error removing layer:",
      error.message,
    );
  }

  try {
    if (sourceId && map.getSource(sourceId)) {
      map.removeSource(sourceId);
    } else if (sourceId) {
      console.warn(`Source not found on map, skipping: ${sourceId}`);
    }
  } catch (error) {
    console.error(
      "[removeSatelliteLayerFromMap] Error removing source:",
      error.message,
    );
  }
};

export const updateSatelliteLayerOpacity = (map, layerId, opacity) => {
  if (!map || !layerId) return;

  try {
    const normalizedOpacity = Math.max(0, Math.min(1, opacity));
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, "raster-opacity", normalizedOpacity);
    }
  } catch (error) {
    console.warn(
      `Error updating satellite layer opacity for ${layerId}:`,
      error.message,
    );
  }
};

/**
 * Cập nhật visibility cho satellite layer
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {string} layerId - Layer ID
 * @param {boolean} visible - true = visible, false = hidden
 */
export const toggleSatelliteLayerVisibility = (map, layerId, visible) => {
  if (!map || !layerId) return;

  try {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none",
      );
    }
  } catch (error) {
    console.warn(
      `Error toggling satellite layer visibility for ${layerId}:`,
      error.message,
    );
  }
};

// =====================================================================
// Classified Layer Helpers - Ảnh phân loại lớp phủ (7 lớp)
// =====================================================================

/**
 * Thêm classified layer vào map (7 lớp phủ lâm nghiệp)
 * Các lớp: Nước, Đô thị, Đất trống, Rừng, Cây bụi, Thảm cỏ, Tuyết/Băng
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {Object} layerData - Layer data { tileUrl, mapId, token, legend }
 * @param {string} layerId - Layer ID
 * @param {number} [opacity=1] - Layer opacity (0-1)
 * @returns {string|null} Source ID hoặc null nếu lỗi
 */
export const addClassifiedLayerToMap = (
  map,
  layerData,
  layerId,
  opacity = 1,
) => {
  if (!map || !layerData?.tileUrl || !layerId) return null;

  const sourceId = buildSatelliteSourceId(layerData.mapId, layerId);

  try {
    // Remove existing if exists
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Add source
    map.addSource(sourceId, {
      type: "raster",
      tiles: [layerData.tileUrl],
      tileSize: 256,
      attribution: "Google Earth Engine - Classified Land Cover",
    });

    // Add layer – below all category layers
    map.addLayer(
      {
        id: layerId,
        type: "raster",
        source: sourceId,
        paint: {
          "raster-opacity": opacity,
        },
      },
      getRasterBeforeId(map),
    );

    return sourceId;
  } catch (error) {
    console.warn(`Error adding classified layer ${layerId}:`, error.message);
    return null;
  }
};

/**
 * Xóa classified layer từ map
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {string} layerId - Layer ID
 * @param {string} sourceId - Source ID (optional)
 */
export const removeClassifiedLayerFromMap = (map, layerId, sourceId) => {
  if (!map) return;

  try {
    if (layerId && map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  } catch (error) {
    console.warn("Error removing classified layer:", error.message);
  }

  try {
    if (sourceId && map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  } catch (error) {
    console.warn("Error removing classified source:", error.message);
  }
};

/**
 * Cập nhật opacity cho classified layer
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {string} layerId - Layer ID
 * @param {number} opacity - Opacity value (0-1)
 */
export const updateClassifiedLayerOpacity = (map, layerId, opacity) => {
  updateSatelliteLayerOpacity(map, layerId, opacity);
};

/**
 * Cập nhật visibility cho classified layer
 * @param {mapboxgl.Map} map - Mapbox map instance
 * @param {string} layerId - Layer ID
 * @param {boolean} visible - true = visible, false = hidden
 */
export const updateClassifiedLayerVisibility = (map, layerId, visible) => {
  toggleSatelliteLayerVisibility(map, layerId, visible);
};
