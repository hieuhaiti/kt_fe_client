import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";

const _formatDistance = (distanceInKm) => {
  if (distanceInKm < 1) {
    return `${(distanceInKm * 1000).toFixed(0)} m`;
  }
  return `${distanceInKm.toFixed(2)} km`;
};

const _formatArea = (areaInSqMeters) => {
  if (areaInSqMeters < 10000) {
    return `${areaInSqMeters.toFixed(0)} mÂ²`;
  }
  return `${(areaInSqMeters / 1000000).toFixed(2)} kmÂ²`;
};

/**
 * Custom hook để hiển thị số đo khoảng cách và diện tích trực tiếp trên bản đồ
 * Sử dụng Mapbox Markers
 */
export const useMeasurementOverlay = (mapRef) => {
  const markersRef = useRef([]);

  /**
   * Xóa tất cả markers đang hiển thị
   */
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, []); // Không có dependencies vì chỉ thao tác với ref

  /**
   * Format số liệu hiển thị
   */
  const formatDistance = (distanceInKm) => {
    if (distanceInKm < 1) {
      return `${(distanceInKm * 1000).toFixed(0)} m`;
    }
    return `${distanceInKm.toFixed(2)} km`;
  };

  const formatArea = (areaInSqMeters) => {
    if (areaInSqMeters < 10000) {
      return `${areaInSqMeters.toFixed(0)} m²`;
    }
    return `${(areaInSqMeters / 1000000).toFixed(2)} km²`;
  };

  /**
   * Tạo marker cho distance (trên các cạnh)
   */
  const createDistanceMarker = useCallback((coordinates, distance, color = "#f97316") => {
    const el = document.createElement("div");
    el.className = "measurement-distance-label";
    el.innerHTML = `
      <div style="
        background: white;
        color: #000;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        border: 1.5px solid ${color};
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        white-space: nowrap;
        pointer-events: none;
      ">
        ${formatDistance(distance)}
      </div>
    `;

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat(coordinates)
      .addTo(mapRef.current.single);

    return marker;
  }, [mapRef]);

  /**
   * Tạo marker cho area (ở giữa polygon)
   */
  const createAreaMarker = useCallback((coordinates, area) => {
    const el = document.createElement("div");
    el.className = "measurement-area-label";
    el.innerHTML = `
      <div style="
        background: rgba(59, 130, 246.95);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        pointer-events: none;
        border: 2px solid rgba(255, 255, 255.5);
      ">
        ${formatArea(area)}
      </div>
    `;

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat(coordinates)
      .addTo(mapRef.current.single);

    return marker;
  }, [mapRef]);

  /**
   * Update measurements cho tất cả features
   */
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const updateMeasurements = useCallback((features) => {
    const map = mapRef.current.single;
    if (!map || !features) return;

    // Xóa markers cũ
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    features.forEach((feature) => {
      if (feature.geometry.type === "LineString") {
        // Xử lý LineString - hiển thị distance trên mỗi đoạn
        const coords = feature.geometry.coordinates;

        for (let i = 0; i < coords.length - 1; i++) {
          const from = turf.point(coords[i]);
          const to = turf.point(coords[i + 1]);
          const distance = turf.distance(from, to, { units: "kilometers" });
          const midpoint = turf.midpoint(from, to);

          const marker = createDistanceMarker(
            midpoint.geometry.coordinates,
            distance,
            "#f97316",
          );

          markersRef.current.push(marker);
        }

        // Tính tổng distance và hiển thị ở cuối line
        const totalDistance = turf.length(feature, { units: "kilometers" });
        const lastPoint = coords[coords.length - 1];

        const totalEl = document.createElement("div");
        totalEl.innerHTML = `
          <div style="
            background: rgba(249, 115, 22.95);
            color: white;
            padding: 4px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            white-space: nowrap;
            pointer-events: none;
            border: 2px solid rgba(255, 255, 255.5);
          ">
            Tổng: ${formatDistance(totalDistance)}
          </div>
        `;

        const totalMarker = new mapboxgl.Marker({
          element: totalEl,
          anchor: "bottom",
          offset: [0, -10],
        })
          .setLngLat(lastPoint)
          .addTo(map);

        markersRef.current.push(totalMarker);
      } else if (feature.geometry.type === "Polygon") {
        // Xử lý Polygon - hiển thị area ở giữa
        const area = turf.area(feature);
        const centroid = turf.centroid(feature);

        const areaMarker = createAreaMarker(
          centroid.geometry.coordinates,
          area,
        );

        markersRef.current.push(areaMarker);

        // Hiển thị distance trên các cạnh của polygon
        const coords = feature.geometry.coordinates[0];
        for (let i = 0; i < coords.length - 1; i++) {
          const from = turf.point(coords[i]);
          const to = turf.point(coords[i + 1]);
          const distance = turf.distance(from, to, { units: "kilometers" });
          const midpoint = turf.midpoint(from, to);

          const marker = createDistanceMarker(
            midpoint.geometry.coordinates,
            distance,
            "#3b82f6",
          );

          markersRef.current.push(marker);
        }
      }
    });
  }, []); // Empty dependencies - chỉ tạo function một lần

  // Cleanup khi component unmount
  useEffect(() => {
    return () => clearMarkers();
  }, []);

  return {
    updateMeasurements,
    clearMarkers,
  };
};
