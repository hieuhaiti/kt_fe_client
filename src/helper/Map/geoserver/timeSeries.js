import { sanitizeOgcId } from "./common";

// Time-series raster layers use a tile URL that already carries the WMS TIME
// dimension baked in by the server (`/map/layer-groups/:group/timeline`).
// Source/layer IDs are keyed by group code so switching TIME on the same group
// updates the same map source in place.
export const buildTimeSeriesSourceId = (groupCode) =>
  `ts-src-${sanitizeOgcId(groupCode)}`.slice(0, 120);

export const buildTimeSeriesLayerId = (sourceId) => `${sourceId}-raster`;

const clampOpacity = (opacity) =>
  Math.max(0, Math.min(1, Number.isFinite(opacity) ? opacity : 0.85));

export const addOrUpdateTimeSeriesLayer = (
  map,
  groupCode,
  { tileUrl, opacity = 0.85 } = {},
) => {
  if (!map || !groupCode || !tileUrl) return;

  const sourceId = buildTimeSeriesSourceId(groupCode);
  const layerId = buildTimeSeriesLayerId(sourceId);
  const finalOpacity = clampOpacity(opacity);

  try {
    // setTiles() không stable trên mọi version mapbox/maplibre — khi tileUrl
    // đổi (autoplay/kéo slider) phải remove source cũ rồi add lại để buộc
    // fetch tile mới. Cùng pattern với ensureRasterLayer ở MonitoringAndAlerting.
    const existingSource = map.getSource(sourceId);
    if (existingSource && existingSource.tiles?.[0] !== tileUrl) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      map.removeSource(sourceId);
    }

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        attribution: "GeoServer",
      });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "raster",
        source: sourceId,
        layout: { visibility: "visible" },
        paint: {
          "raster-opacity": finalOpacity,
          "raster-fade-duration": 250,
        },
      });
      return;
    }

    map.setPaintProperty(layerId, "raster-opacity", finalOpacity);
    map.setLayoutProperty(layerId, "visibility", "visible");
  } catch (error) {
    console.warn("Lỗi khi thêm/cập nhật lớp ảnh theo thời gian:", error.message);
  }
};

export const removeTimeSeriesLayer = (map, groupCode) => {
  if (!map || !groupCode) return;

  try {
    const sourceId = buildTimeSeriesSourceId(groupCode);
    const layerId = buildTimeSeriesLayerId(sourceId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch (error) {
    console.warn("Lỗi khi xóa lớp ảnh theo thời gian:", error.message);
  }
};
