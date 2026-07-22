/**
 * Custom hook quản lý toàn bộ vòng đời Web Worker cho phân tích buffer không gian.
 *
 * Chiến lược:
 * - Tạo Worker từ Blob URL (không cần file server riêng)
 * - Debounce 300ms: tránh spam Worker khi user kéo slider
 * - Terminate worker cũ ngay khi params thay đổi (không để 2 worker chạy song song)
 * - Expose progress % để UI feedback realtime
 *
 * @import { useSpatialAnalysis } from '@/hooks/analysis/useSpatialAnalysis'
 */

import { useEffect, useRef, useCallback, useState } from "react";

function getWorkerCode() {
  return `
importScripts("https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js");

/**
 * CHIẾN LƯỢC TỐI ƯU TRONG WORKER:
 * 1. simplify()          → giảm vertices đường biên giới trước khi buffer
 * 2. buffer()            → tạo polygon vùng đệm (xử lý riêng MultiLineString)
 * 3. Tách Point/Polygon  → xử lý riêng từng loại geometry
 * 4. bboxFilter          → loại sớm features ngoài bounding box (O(1) check)
 * 5. pointsWithinPolygon → ray-cast cho Point features
 * 6. booleanIntersects   → kiểm tra giao cho Polygon features
 */

self.onmessage = function (e) {
  var borderFeature = e.data.borderFeature;
  var settlements = e.data.settlements;
  var bufferDistance = e.data.bufferDistance;
  var bufferUnits = e.data.bufferUnits;
  var tolerance = e.data.tolerance;
  var borderMarkers = e.data.borderMarkers;
  var markerBufferDistance = e.data.markerBufferDistance;

  try {
    self.postMessage({ type: "progress", step: "simplify", pct: 5 });

    // ── Bước 1: Simplify đường biên giới ──────────────────────────────────
    var simplified = turf.simplify(borderFeature, {
      tolerance: tolerance != null ? tolerance : 0.001,
      highQuality: false,
      mutate: false,
    });

    self.postMessage({ type: "progress", step: "buffer", pct: 20 });

    // ── Bước 2: Tạo buffer polygon (skip nếu distance = 0) ───────────────
    var bufferPoly = null;
    if (bufferDistance > 0) {
      if (simplified.geometry.type === "MultiLineString") {
        var segments = simplified.geometry.coordinates;
        var buffers = segments.map(function(coords) {
          return turf.buffer(turf.lineString(coords), bufferDistance, { units: bufferUnits });
        });
        bufferPoly = buffers.reduce(function(acc, cur) {
          return acc ? turf.union(acc, cur) : cur;
        }, null);
      } else {
        bufferPoly = turf.buffer(simplified, bufferDistance, { units: bufferUnits });
      }
    }

    // ── Bước 2.1: Buffer mốc giới (Point) và union vào buffer đường biên
    var analysisBuffer = bufferPoly;
    if (
      borderMarkers &&
      borderMarkers.features &&
      borderMarkers.features.length > 0 &&
      markerBufferDistance != null &&
      markerBufferDistance > 0
    ) {
      var markerBuffers = borderMarkers.features
        .filter(function (f) {
          return f && f.geometry && f.geometry.type === "Point";
        })
        .map(function (f) {
          return turf.buffer(f, markerBufferDistance, { units: bufferUnits });
        });

      var markerUnion = markerBuffers.reduce(function (acc, cur) {
        return acc ? turf.union(acc, cur) : cur;
      }, null);

      if (markerUnion) {
        analysisBuffer = analysisBuffer
          ? turf.union(analysisBuffer, markerUnion)
          : markerUnion;
      }
    }

    // Nếu cả 2 buffer đều = 0 → không có vùng đệm → trả kết quả rỗng
    if (!analysisBuffer) {
      self.postMessage({ type: "progress", step: "done", pct: 100 });
      self.postMessage({
        type: "result",
        data: { type: "FeatureCollection", features: [] },
        stats: {
          totalSettlements: settlements.features.length,
          afterBboxFilter: 0,
          matched: 0,
          matchedPoints: 0,
          matchedPolygons: 0,
          originalVertices: countVertices(borderFeature),
          simplifiedVertices: countVertices(simplified),
        },
        bufferGeoJSON: null,
      });
      return;
    }

    self.postMessage({ type: "progress", step: "bbox_filter", pct: 55 });

    // ── Bước 3: Tách Point/Polygon và lọc BBox ───────────────────────────
    var bufferBbox = turf.bbox(analysisBuffer);
    var minX = bufferBbox[0], minY = bufferBbox[1];
    var maxX = bufferBbox[2], maxY = bufferBbox[3];

    var pointFeatures = [];
    var polygonFeatures = [];

    settlements.features.forEach(function(f) {
      if (!f.geometry) return;
      var gType = f.geometry.type;
      if (gType === "Point") {
        pointFeatures.push(f);
      } else if (gType === "Polygon" || gType === "MultiPolygon") {
        polygonFeatures.push(f);
      }
    });

    var filteredPoints = {
      type: "FeatureCollection",
      features: pointFeatures.filter(function(f) {
        var lng = f.geometry.coordinates[0];
        var lat = f.geometry.coordinates[1];
        return lng >= minX && lng <= maxX && lat >= minY && lat <= maxY;
      }),
    };

    var filteredPolygons = polygonFeatures.filter(function(f) {
      var fb = turf.bbox(f);
      return fb[2] >= minX && fb[0] <= maxX && fb[3] >= minY && fb[1] <= maxY;
    });

    var totalAfterBbox = filteredPoints.features.length + filteredPolygons.length;

    self.postMessage({
      type: "progress",
      step: "point_in_polygon",
      pct: 65,
      meta: { total: settlements.features.length, afterBbox: totalAfterBbox },
    });

    // ── Bước 4: Ray-casting cho Point features ────────────────────────────
    var matchedPoints = turf.pointsWithinPolygon(filteredPoints, analysisBuffer);

    // ── Bước 5: Intersect check cho Polygon features ──────────────────────
    var matchedPolygons = filteredPolygons.filter(function(f) {
      return turf.booleanIntersects(f, analysisBuffer);
    });

    // Gộp kết quả Point + Polygon
    var result = {
      type: "FeatureCollection",
      features: matchedPoints.features.concat(matchedPolygons),
    };

    self.postMessage({ type: "progress", step: "done", pct: 100 });

    self.postMessage({
      type: "result",
      data: result,
      stats: {
        totalSettlements: settlements.features.length,
        afterBboxFilter: totalAfterBbox,
        matched: result.features.length,
        matchedPoints: matchedPoints.features.length,
        matchedPolygons: matchedPolygons.length,
        originalVertices: countVertices(borderFeature),
        simplifiedVertices: countVertices(simplified),
      },
      bufferGeoJSON: analysisBuffer,
    });
  } catch (err) {
    self.postMessage({ type: "error", message: err.message });
  }
};

function countVertices(feature) {
  var coords = feature.geometry.coordinates;
  if (feature.geometry.type === "LineString") return coords.length;
  if (feature.geometry.type === "MultiLineString")
    return coords.reduce(function(s, l) { return s + l.length; });
  return 0;
}
  `.trim();
}

const STEP_LABELS = {
  simplify: "Đơn giản hóa đường biên giới…",
  buffer: "Tạo vùng đệm polygon…",
  bbox_filter: "Lọc sơ bộ bounding box…",
  point_in_polygon: "Kiểm tra điểm trong vùng đệm…",
  done: "Hoàn tất",
};

/**
 * @typedef {Object} SpatialAnalysisState
 * @property {string} status - 'idle' | 'loading' | 'done' | 'error'
 * @property {Object|null} result - GeoJSON FeatureCollection kết quả
 * @property {Object|null} bufferGeoJSON - Polygon vùng đệm
 * @property {Object|null} stats - Thống kê (vertices, điểm match, v.v.)
 * @property {number} progress - 0-100
 * @property {string} progressStep - Nhãn bước hiện tại
 * @property {string|null} error - Pesan lỗi nếu có
 */

/**
 * @param {Object} config
 * @param {Object} config.borderFeature - GeoJSON LineString/MultiLineString
 * @param {Object} config.settlements - GeoJSON FeatureCollection of Points
 * @param {Object} [config.borderMarkers] - GeoJSON FeatureCollection of marker Points
 * @param {number} config.bufferDistance - Khoảng cách buffer (default: 1)
 * @param {number} [config.markerBufferDistance] - Khoảng cách buffer cho mốc giới
 * @param {string} [config.bufferUnits] - 'kilometers' | 'meters' (default: 'kilometers')
 * @param {number} [config.tolerance] - Độ chính xác simplify (default: 0.001)
 * @returns {SpatialAnalysisState}
 */
export function useSpatialAnalysis({
  borderFeature,
  settlements,
  borderMarkers,
  bufferDistance,
  markerBufferDistance,
  bufferUnits = "kilometers",
  tolerance = 0.001,
}) {
  const [state, setState] = useState({
    status: "idle",
    result: null,
    bufferGeoJSON: null,
    stats: null,
    progress: 0,
    progressStep: "",
    error: null,
  });

  const workerRef = useRef(null);
  const debounceRef = useRef(null);
  const workerBlobUrl = useRef(null);

  // Tạo Blob URL cho worker (1 lần)
  useEffect(() => {
    const workerCode = getWorkerCode();
    const blob = new Blob([workerCode], { type: "application/javascript" });
    workerBlobUrl.current = URL.createObjectURL(blob);

    return () => {
      if (workerBlobUrl.current) {
        URL.revokeObjectURL(workerBlobUrl.current);
      }
    };
  }, []);

  const run = useCallback(() => {
    if (!borderFeature || !settlements || !workerBlobUrl.current) return;

    // Kill worker đang chạy (nếu có)
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    setState((s) => ({
      ...s,
      status: "loading",
      progress: 0,
      progressStep: "Khởi động…",
      error: null,
    }));

    const worker = new Worker(workerBlobUrl.current);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;

      if (msg.type === "progress") {
        setState((s) => ({
          ...s,
          progress: msg.pct ?? 0,
          progressStep: STEP_LABELS[msg.step] || msg.step,
        }));
      } else if (msg.type === "result") {
        setState((s) => ({
          ...s,
          status: "done",
          result: msg.data,
          bufferGeoJSON: msg.bufferGeoJSON,
          stats: msg.stats,
          progress: 100,
        }));
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === "error") {
        setState((s) => ({
          ...s,
          status: "error",
          error: msg.message,
          progress: 0,
        }));
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = (err) => {
      setState((s) => ({
        ...s,
        status: "error",
        error: err.message || "Worker error",
        progress: 0,
      }));
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({
      borderFeature,
      settlements,
      borderMarkers,
      bufferDistance,
      markerBufferDistance,
      bufferUnits,
      tolerance,
    });
  }, [
    borderFeature,
    settlements,
    borderMarkers,
    bufferDistance,
    markerBufferDistance,
    bufferUnits,
    tolerance,
  ]);

  // Debounce: chờ 300ms sau khi params thay đổi mới chạy
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(run, 300);

    return () => clearTimeout(debounceRef.current);
  }, [run]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return state;
}
