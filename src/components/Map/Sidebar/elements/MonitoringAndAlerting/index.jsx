import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  Eye,
  EyeOff,
  Flame,
  Image,
  Info,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ThermometerSun,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/utils";
import { useMapStore } from "@/stores/Map/useMapStore";
import {
  getFireRiskLatest,
  getFireRiskMap,
  getFireRiskHistory,
} from "@/features/map/api/fireRiskApi";
import { buildWmsTileUrl } from "@/helper/Map/geoserver/wms";

// ─────────────────────────────────────────────────────────────────────────────
// DATA MODEL v4 (province + districts, GeoServer raster)
//
// `/fire-risk/latest` và `/map` trả:
//   - snapshot.provinceSummary { avgRiskLevel, maxLevel, riskLevelDist{1..5},
//     s2CoverageRatio, ... }
//   - snapshot.districtStats[] { name, unitCode, s2Coverage, riskLevelDist{1..5} }
//   - snapshot.geoserverLayer (string|null) — layer name để build WMS tile,
//     null khi raster chưa publish xong.
//   - features[]: geometry null hiện tại (polygon huyện được vẽ từ WMS raster).
//
// UI:
//   - WMS tile GeoServer làm nền (khi geoserverLayer sẵn sàng)
//   - KPI tỉnh: cấp TB, S2 phủ
//   - Card cấp cảnh báo tỉnh + breakdown ha theo cấp
//   - Bảng huyện (cấp/S2)
//   - Filter cấp, chú giải, banner stale/computing
//
// Responsive: dùng container queries (@container + @[…]:) vì sidebar chiều rộng
// biến thiên theo layout ngoài, không map được với breakpoint viewport.
// ─────────────────────────────────────────────────────────────────────────────

const FIRE_SOURCE_DIST = "fire-risk-district-source";
const FIRE_RASTER_SOURCE = "fire-risk-raster-source";
const FIRE_DIST_FILL = "fire-risk-district-fill";
const FIRE_DIST_LINE = "fire-risk-district-line";
const FIRE_RASTER_LAYER = "fire-risk-raster";
const HISTORY_SRC_PREFIX = "fire-risk-hist-src-";
const HISTORY_LAYER_PREFIX = "fire-risk-hist-lyr-";
const ALL_VALUE = "all";

const RISK_LEVELS = {
  1: { label: "Cấp I — Thấp", color: "#00a65a", badge: "soft-success" },
  2: { label: "Cấp II — Trung bình", color: "#f6e84a", badge: "soft-warning" },
  3: { label: "Cấp III — Cao", color: "#f39c12", badge: "warning" },
  4: { label: "Cấp IV — Nguy hiểm", color: "#e74c3c", badge: "destructive" },
  5: {
    label: "Cấp V — Cực kỳ nguy hiểm",
    color: "#7b241c",
    badge: "soft-destructive",
  },
};

const getRiskMeta = (level) => RISK_LEVELS[level] ?? RISK_LEVELS[1];

// Trung tâm Kon Tum để fly-to nếu server không gửi centroid.
const KONTUM_FALLBACK_CENTROID = { lng: 107.9, lat: 14.6 };

// ── CRS reprojection (UTM 48N ↔ WGS84) ──────────────────────────────────────
//
// Server persist geometry + centroid ở EPSG:32648 (UTM Zone 48N, meters).
// maplibre/mapbox chỉ nhận WGS84 (lng/lat degrees). Không có proj4 trong deps,
// nên implement inverse Transverse Mercator theo Snyder (WGS84 ellipsoid).

const UTM48N_ZONE = 48;
const UTM_A = 6378137; // WGS84 semi-major axis
const UTM_E2 = 0.00669437999014; // WGS84 e² (first eccentricity squared)
const UTM_K0 = 0.9996;

/**
 * Chuyển 1 cặp (easting, northing) UTM 48N → { lng, lat } WGS84 degrees.
 * Formula: Snyder "Map Projections — A Working Manual" §8.
 */
function utm48nToLngLat(easting, northing) {
  const x = easting - 500000;
  const y = northing; // UTM 48N (bắc bán cầu) không cần offset 10_000_000
  const e1 = (1 - Math.sqrt(1 - UTM_E2)) / (1 + Math.sqrt(1 - UTM_E2));
  const eSq = UTM_E2 / (1 - UTM_E2);

  const M = y / UTM_K0;
  const mu =
    M /
    (UTM_A *
      (1 - UTM_E2 / 4 - (3 * UTM_E2 ** 2) / 64 - (5 * UTM_E2 ** 3) / 256));

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const tanPhi1 = Math.tan(phi1);

  const N1 = UTM_A / Math.sqrt(1 - UTM_E2 * sinPhi1 ** 2);
  const T1 = tanPhi1 ** 2;
  const C1 = eSq * cosPhi1 ** 2;
  const R1 = (UTM_A * (1 - UTM_E2)) / (1 - UTM_E2 * sinPhi1 ** 2) ** 1.5;
  const D = x / (N1 * UTM_K0);

  const latRad =
    phi1 -
    ((N1 * tanPhi1) / R1) *
      (D ** 2 / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * eSq) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * eSq - 3 * C1 ** 2) *
          D ** 6) /
          720);

  const lngRad =
    (D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * eSq + 24 * T1 ** 2) * D ** 5) /
        120) /
    cosPhi1;

  const lng0Rad = (((UTM48N_ZONE - 1) * 6 - 180 + 3) * Math.PI) / 180;
  return {
    lng: ((lng0Rad + lngRad) * 180) / Math.PI,
    lat: (latRad * 180) / Math.PI,
  };
}

/**
 * Heuristic: coords WGS84 luôn |lng| ≤ 180, |lat| ≤ 90. UTM 48N meters cỡ
 * ~10⁵–10⁶ → dễ phân biệt.
 */
function looksLikeUtm(x, y) {
  return Math.abs(x) > 360 || Math.abs(y) > 90;
}

/**
 * Reproject 1 điểm (lng, lat) hoặc (x, y). Chấp nhận WGS84 hoặc UTM 48N.
 * Trả về { lng, lat } WGS84.
 */
function toWgs84Point(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (!looksLikeUtm(x, y)) return { lng: x, lat: y };
  const { lng, lat } = utm48nToLngLat(x, y);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return { lng, lat };
}

/**
 * Reproject centroid server (server dùng { lat, lng } — lat là NORTHING, lng là
 * EASTING khi ở UTM). Trả về { lng, lat } WGS84 hoặc null.
 */
function centroidToWgs84(c) {
  if (!c) return null;
  const p = toWgs84Point(Number(c.lng), Number(c.lat));
  if (!p) return null;
  // Bảo vệ maplibre.flyTo — clamp lat vào phạm vi hợp lệ.
  if (Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180) return null;
  return p;
}

/**
 * Reproject toàn bộ coordinates của Polygon/MultiPolygon từ UTM 48N → WGS84.
 * Trả về geometry mới hoặc null nếu rỗng / không hợp lệ.
 */
function geometryToWgs84(geometry) {
  if (!geometry?.type || !Array.isArray(geometry.coordinates)) return null;
  const crsName = geometry?.crs?.properties?.name || "";
  const forceUtm = crsName.includes("32648");

  const convertPt = ([x, y]) => {
    if (forceUtm || looksLikeUtm(x, y)) {
      const { lng, lat } = utm48nToLngLat(x, y);
      return [lng, lat];
    }
    return [x, y];
  };
  const convertRing = (ring) => ring.map(convertPt);
  const convertPolygon = (poly) => poly.map(convertRing);

  if (geometry.type === "Polygon") {
    if (!geometry.coordinates.length) return null;
    return {
      type: "Polygon",
      coordinates: convertPolygon(geometry.coordinates),
    };
  }
  if (geometry.type === "MultiPolygon") {
    if (!geometry.coordinates.length) return null;
    return {
      type: "MultiPolygon",
      coordinates: geometry.coordinates.map(convertPolygon),
    };
  }
  return null;
}

// ── Format helpers ──────────────────────────────────────────────────────────

const fmtHa = (n) =>
  Number.isFinite(n) && n > 0
    ? n.toLocaleString("vi", { maximumFractionDigits: 0 }) + " ha"
    : "—";

const fmtNum = (n, digits = 1) =>
  Number.isFinite(n)
    ? n.toLocaleString("vi", { maximumFractionDigits: digits })
    : "—";

const fmtPct = (n) => (Number.isFinite(n) ? Math.round(n * 100) + "%" : "—");

// ── Response normalisation ─────────────────────────────────────────────────

/**
 * Chuẩn hoá payload /latest + /map thành view sẵn dùng cho UI.
 *
 * Đầu vào:
 *   - latestPayload.snapshot.districtStats[] { name, unitCode, centroid, geometry, riskLevelDist, ... }
 *     — centroid và geometry ở EPSG:32648 (UTM 48N meters).
 *   - mapPayload.features[] GeoJSON — geometry Polygon/MultiPolygon (UTM 32648)
 *     kèm properties { riskLevel, districtCode, districtName, centroid, ... }.
 *     1 huyện có thể có 3-5 features (mỗi cấp 1 record) — dedupe theo
 *     districtCode và giữ maxLevel + geometry chung.
 *
 * Đầu ra: mọi centroid + geometry đều đã reproject sang WGS84.
 */
function extractFireRiskView({ latestPayload, mapPayload }) {
  const snap = latestPayload?.snapshot ?? null;
  const summary = snap?.provinceSummary ?? snap?.province_summary ?? null;

  const mapFeatures = Array.isArray(mapPayload?.features)
    ? mapPayload.features
    : [];
  const latestFeatures = Array.isArray(latestPayload?.features)
    ? latestPayload.features
    : [];

  // Breakdown ha theo cấp: ưu tiên summary; fallback ghép từ features[].
  let riskLevelDist =
    summary?.riskLevelDist ?? summary?.risk_level_dist ?? null;
  if (!riskLevelDist || Object.values(riskLevelDist).every((v) => !v)) {
    const acc = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const f of mapFeatures.length ? mapFeatures : latestFeatures) {
      const p = f.properties ?? f;
      const lvl = Number(p.riskLevel ?? p.risk_level);
      const ha = Number(p.areaHa ?? p.area_ha);
      if (lvl >= 1 && lvl <= 5 && Number.isFinite(ha)) acc[lvl] += ha;
    }
    riskLevelDist = acc;
  }

  let maxLevel = 0;
  for (let l = 5; l >= 1; l--) {
    if ((riskLevelDist[l] || 0) > 0) {
      maxLevel = l;
      break;
    }
  }

  // ── Dedupe map features theo districtCode ─────────────────────────────────
  // Server trả 1 feature / (huyện × cấp). Ta gộp về 1 feature / huyện, giữ
  // geometry chung + maxLevel để tô màu theo huyện.
  const districtGeomByCode = new Map();
  for (const f of mapFeatures) {
    const p = f.properties ?? {};
    const code = String(p.districtCode ?? p.district_code ?? "");
    if (!code) continue;
    const lvl = Number(p.riskLevel ?? p.risk_level) || 0;
    const geomWgs = geometryToWgs84(f.geometry);
    const centroidWgs = centroidToWgs84(p.centroid);

    const cur = districtGeomByCode.get(code);
    if (!cur) {
      districtGeomByCode.set(code, {
        code,
        name: p.districtName ?? p.district_name ?? code,
        maxLevel: lvl,
        geometry: geomWgs,
        centroid: centroidWgs,
      });
    } else {
      if (lvl > cur.maxLevel) cur.maxLevel = lvl;
      if (!cur.geometry && geomWgs) cur.geometry = geomWgs;
      if (!cur.centroid && centroidWgs) cur.centroid = centroidWgs;
    }
  }

  // ── Districts từ snapshot.districtStats (thống kê + centroid + có thể geom) ─
  const districts = Array.isArray(snap?.districtStats)
    ? snap.districtStats.map((d) => {
        const dist = d.riskLevelDist ?? d.risk_level_dist ?? {};
        let dMax = 0;
        let dSumHa = 0;
        let dTopHa = 0; // ha ở CHÍNH cấp maxLevel (không cộng cả 1..5)
        for (let l = 5; l >= 1; l--) {
          const ha = Number(dist[l]) || 0;
          if (ha > 0 && dMax === 0) {
            dMax = l;
            dTopHa = ha;
          }
          if (l >= 1) dSumHa += ha;
        }
        const code = d.unitCode != null ? String(d.unitCode) : null;
        const centroidWgs = centroidToWgs84(d.centroid);
        const geomWgs = geometryToWgs84(d.geometry);
        // Bổ sung geometry/centroid vào map features nếu chưa có.
        if (code && districtGeomByCode.has(code)) {
          const entry = districtGeomByCode.get(code);
          if (!entry.geometry && geomWgs) entry.geometry = geomWgs;
          if (!entry.centroid && centroidWgs) entry.centroid = centroidWgs;
        } else if (code && (geomWgs || centroidWgs)) {
          districtGeomByCode.set(code, {
            code,
            name: d.name || code,
            maxLevel: dMax,
            geometry: geomWgs,
            centroid: centroidWgs,
          });
        }
        return {
          name: d.name,
          unitCode: d.unitCode ?? d.unit_code ?? null,
          s2Coverage: d.s2Coverage ?? d.s2_coverage ?? null,
          riskLevelDist: dist,
          maxLevel: dMax,
          topLevelHa: dTopHa,
          alertedHa: dSumHa,
          centroid: centroidWgs,
        };
      })
    : [];

  // ── FeatureCollection để render lên map (WGS84) ─────────────────────────
  const districtFeatureCollection = {
    type: "FeatureCollection",
    features: Array.from(districtGeomByCode.values())
      .filter((d) => d.geometry)
      .map((d) => {
        const meta = getRiskMeta(d.maxLevel || 1);
        return {
          type: "Feature",
          geometry: d.geometry,
          properties: {
            districtCode: d.code,
            districtName: d.name,
            maxLevel: d.maxLevel,
            color: meta.color,
          },
        };
      }),
  };

  // Province centroid = trung bình centroid các huyện (WGS84). Fallback Kon Tum.
  const validCentroids = Array.from(districtGeomByCode.values())
    .map((d) => d.centroid)
    .filter(Boolean);
  const centroid = validCentroids.length
    ? {
        lng:
          validCentroids.reduce((s, c) => s + c.lng, 0) / validCentroids.length,
        lat:
          validCentroids.reduce((s, c) => s + c.lat, 0) / validCentroids.length,
      }
    : KONTUM_FALLBACK_CENTROID;

  return {
    snapshot: snap,
    districtFeatureCollection,
    provinceName: "Kon Tum",
    centroid,
    riskLevelDist,
    maxLevel,
    avgRiskLevel: summary?.avgRiskLevel ?? summary?.avg_risk_level ?? null,
    s2CoverageRatio:
      summary?.s2CoverageRatio ?? summary?.s2_coverage_ratio ?? null,
    districts,
    geoserverLayer:
      snap?.geoserverLayer ??
      mapPayload?.geoserverLayer ??
      latestPayload?.geoserverLayer ??
      null,
    // Fallback raster URL từ Earth Engine — server luôn cố sinh field này
    // (getEeMapId), KHÔNG cần GCS. TTL ~24h nên nếu snapshot cũ hơn 24h URL
    // có thể expired → 404. Client vẫn thử, thất bại thì maplibre log warning
    // không crash.
    geeTileUrl:
      snap?.geeTileUrl ??
      snap?.gee_tile_url ??
      latestPayload?.geeTileUrl ??
      null,
    // GeoTIFF download URL. Ưu tiên `geoserverDownloadUrl` (WCS, persistent,
    // full-res) → fallback `geeDownloadUrl` (GEE trần, TTL 24h). Server thêm
    // field `geoserverDownloadUrl` khi snapshot đã publish GeoServer.
    geeDownloadUrl:
      snap?.geoserverDownloadUrl ??
      snap?.geoserver_download_url ??
      snap?.geeDownloadUrl ??
      snap?.gee_download_url ??
      null,
    // Filename gợi ý từ server (`fire_risk_kontum_YYYYMMDD.tif`). Client dùng
    // cho `<a download>` — GEE mặc định trả `<hash>:getPixels.tiff`.
    geeDownloadFilename:
      snap?.downloadFilename ??
      snap?.geeDownloadFilename ??
      snap?.gee_download_filename ??
      null,
    stale: Boolean(latestPayload?.stale),
    computing: Boolean(latestPayload?.computing),
  };
}

// ── Map layer helpers ────────────────────────────────────────────────────────

function removeFireLayers(map) {
  [FIRE_DIST_LINE, FIRE_DIST_FILL, FIRE_RASTER_LAYER].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  [FIRE_SOURCE_DIST, FIRE_RASTER_SOURCE].forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });
}

// ── Ensure-source-and-layer helpers (idempotent, không teardown) ──────────────
//
// Bí quyết không nháy — làm giống satellite [LayerManager]:
//   1. Layer lifecycle effect chỉ chạy khi visibility hoặc dữ liệu đổi. Với
//      opacity → dùng `setPaintProperty` trên layer đã tồn tại → không tạo lại.
//   2. Khi cùng 1 source đã có, dùng `getSource().setData()` thay vì
//      removeSource + addSource. Tránh cả nháy vector lẫn re-fetch tile.

function ensureRasterLayer(map, tileUrl) {
  // Không có URL → không tạo (nhưng KHÔNG xoá nếu đang có; caller sẽ dùng
  // setLayerVisibilityOnMap để ẩn). Cleanup thật sự chỉ khi unmount.
  if (!tileUrl) return;
  // Detect URL change: nếu tile URL đã đổi → phải remove source cũ (setTiles
  // không stable ở tất cả version maplibre) rồi add lại. Đây là hành vi mong
  // muốn: user thấy nền cập nhật khi snapshot mới.
  const src = map.getSource(FIRE_RASTER_SOURCE);
  if (src && src.tiles?.[0] !== tileUrl) {
    if (map.getLayer(FIRE_RASTER_LAYER)) map.removeLayer(FIRE_RASTER_LAYER);
    map.removeSource(FIRE_RASTER_SOURCE);
  }
  if (!map.getSource(FIRE_RASTER_SOURCE)) {
    map.addSource(FIRE_RASTER_SOURCE, {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
      attribution: "GeoServer WMS — Fire Risk",
    });
  }
  if (!map.getLayer(FIRE_RASTER_LAYER)) {
    map.addLayer({
      id: FIRE_RASTER_LAYER,
      type: "raster",
      source: FIRE_RASTER_SOURCE,
    });
  }
}

function ensureDistrictLayer(map, featureCollection) {
  if (!featureCollection?.features?.length) {
    [FIRE_DIST_LINE, FIRE_DIST_FILL].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource(FIRE_SOURCE_DIST)) map.removeSource(FIRE_SOURCE_DIST);
    return;
  }
  const src = map.getSource(FIRE_SOURCE_DIST);
  if (src) {
    src.setData(featureCollection);
  } else {
    map.addSource(FIRE_SOURCE_DIST, {
      type: "geojson",
      data: featureCollection,
    });
  }
  if (!map.getLayer(FIRE_DIST_FILL)) {
    map.addLayer({
      id: FIRE_DIST_FILL,
      type: "fill",
      source: FIRE_SOURCE_DIST,
      paint: {
        "fill-color": ["get", "color"],
        // opacity set qua setPaintProperty riêng (effect opacity).
      },
    });
  }
  if (!map.getLayer(FIRE_DIST_LINE)) {
    map.addLayer({
      id: FIRE_DIST_LINE,
      type: "line",
      source: FIRE_SOURCE_DIST,
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1.8,
      },
    });
  }
}

// Set visibility bằng `layout.visibility` — maplibre khuyến nghị vì thao tác
// paint layer khi source vẫn còn, không phải tháo lắp.
function setLayerVisibilityOnMap(map, layerId, visible) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

// Add/update raster overlay từ history snapshot. Mỗi snapshot 1 source + layer
// riêng để user có thể chồng nhiều tháng lên nhau. Insert BELOW district fill
// để boundary luôn nằm trên (dễ đọc). Nếu URL đổi (không xảy ra vì layer name
// stable), remove + add lại.
function ensureHistoryRasterLayer(map, id, tileUrl, opacity, visible) {
  const srcId = `${HISTORY_SRC_PREFIX}${id}`;
  const lyrId = `${HISTORY_LAYER_PREFIX}${id}`;
  const src = map.getSource(srcId);
  if (src && src.tiles?.[0] !== tileUrl) {
    if (map.getLayer(lyrId)) map.removeLayer(lyrId);
    map.removeSource(srcId);
  }
  if (!map.getSource(srcId)) {
    map.addSource(srcId, {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
      attribution: "GeoServer WMS — Fire Risk (history)",
    });
  }
  if (!map.getLayer(lyrId)) {
    // Chèn dưới district fill để boundary luôn nằm trên, dễ đọc.
    const beforeId = map.getLayer(FIRE_DIST_FILL) ? FIRE_DIST_FILL : undefined;
    map.addLayer(
      {
        id: lyrId,
        type: "raster",
        source: srcId,
        paint: { "raster-opacity": opacity },
        layout: { visibility: visible ? "visible" : "none" },
      },
      beforeId,
    );
  } else {
    map.setPaintProperty(lyrId, "raster-opacity", opacity);
    map.setLayoutProperty(lyrId, "visibility", visible ? "visible" : "none");
  }
}

function removeHistoryRasterLayer(map, id) {
  const srcId = `${HISTORY_SRC_PREFIX}${id}`;
  const lyrId = `${HISTORY_LAYER_PREFIX}${id}`;
  if (map.getLayer(lyrId)) map.removeLayer(lyrId);
  if (map.getSource(srcId)) map.removeSource(srcId);
}

/**
 * Bounding box (WGS84) của toàn FeatureCollection để fitBounds.
 */
function getFeatureCollectionBbox(fc) {
  if (!fc?.features?.length) return null;
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  const walk = (arr) => {
    if (typeof arr[0] === "number") {
      const [x, y] = arr;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      return;
    }
    for (const inner of arr) walk(inner);
  };
  for (const f of fc.features) {
    if (Array.isArray(f?.geometry?.coordinates)) walk(f.geometry.coordinates);
  }
  if (!Number.isFinite(minX)) return null;
  return [
    [minX, minY],
    [maxX, maxY],
  ];
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function LabelWithTooltip({ label, tip, wide = false }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 border-b border-dashed border-muted-foreground/40">
          {label}
          <Info className="h-3 w-3 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className={`text-[11px] leading-relaxed ${wide ? "max-w-sm" : "max-w-xs"}`}
      >
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function MonitoringAndAlerting() {
  const mapInstance = useMapStore((s) => s.mapInstance);

  const [view, setView] = useState(null); // extractProvinceView() output
  const [rasterTileUrl, setRasterTileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(ALL_VALUE);

  // ── History overlays — layer WMS các snapshot cũ đã publish ──────────────
  // `historyItems`: list [{id, analysisDate, geoserverLayer, tileUrl}] filtered
  //   chỉ chứa item CÓ geoserver_layer (đã publish) — item chỉ có GEE tile URL
  //   không load vào đây vì TTL 24h, add rồi vài giờ sau tile 404.
  // `historyLayers`: state `{ [id]: { visible, opacity } }` — chỉ track UI
  //   state của snapshot ĐANG được add lên map. Xoá khoản khỏi map ↔ delete key.
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLayers, setHistoryLayers] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [latestRes, mapRes] = await Promise.all([
        getFireRiskLatest(1),
        getFireRiskMap(1),
      ]);
      const latestPayload = latestRes?.data ?? latestRes;
      const mapPayload = mapRes?.data ?? mapRes;

      const nextView = extractFireRiskView({ latestPayload, mapPayload });
      setView(nextView);

      // Thứ tự nguồn raster nền (fallback chain):
      //   1. WMS GeoServer từ `geoserverLayer` — persistent, không expire.
      //      Có khi server đã export GCS → MinIO → GeoServer publish thành công.
      //   2. Earth Engine tile URL từ `geeTileUrl` — server luôn cố sinh field
      //      này (không cần GCS). URL có TTL ~24h nên với snapshot cũ hơn 24h
      //      có thể expired (maplibre log 404, không crash).
      //   3. Không có raster → chỉ vẽ vector polygon huyện (fill opacity 0.45
      //      trong addDistrictLayers).
      let tile = null;
      if (nextView.geoserverLayer) {
        tile = buildWmsTileUrl({ geoserver_layer: nextView.geoserverLayer });
      } else if (nextView.geeTileUrl) {
        tile = nextView.geeTileUrl;
      }
      setRasterTileUrl(tile || null);
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu cảnh báo cháy rừng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch history 1 lần khi mount. Endpoint public `/published-history` đã
  // force filter geoserver_layer server-side → payload chỉ chứa snapshot đã
  // publish (nhỏ hơn, không phải fetch cả list rồi filter client).
  // GEE-only snapshot không cần vì URL TTL 24h expire, add rồi vài giờ 404.
  useEffect(() => {
    (async () => {
      try {
        const res = await getFireRiskHistory(1, 24);
        const rawItems = res?.data?.data?.items ?? res?.data?.items ?? [];
        const enriched = rawItems
          .map((it) => {
            const layer = it.geoserver_layer || it.geoserverLayer;
            if (!layer) return null;
            return {
              id: String(it.id),
              analysisDate: it.analysis_date || it.analysisDate,
              geoserverLayer: layer,
              tileUrl: buildWmsTileUrl({ geoserver_layer: layer }),
            };
          })
          .filter((it) => it && it.tileUrl);
        setHistoryItems(enriched);
      } catch (err) {
        console.warn("[FireRisk] load history failed:", err?.message);
      }
    })();
  }, []);

  // Danh sách cấp thực sự có diện tích — chỉ hiện các cấp > 0 trong dropdown.
  const levelsWithArea = useMemo(() => {
    if (!view) return [];
    const out = [];
    for (let l = 5; l >= 1; l--) {
      const ha = view.riskLevelDist?.[l] || 0;
      if (ha > 0) out.push({ level: l, ha });
    }
    return out;
  }, [view]);

  // Filter theo cấp — hiển thị breakdown lọc bớt. Vì chỉ có 1 tỉnh nên không
  // có "danh sách bị ẩn". Chỉ tô đậm/highlight cấp được chọn.
  const filteredLevels = useMemo(() => {
    if (selectedLevel === ALL_VALUE) return levelsWithArea;
    return levelsWithArea.filter((l) => String(l.level) === selectedLevel);
  }, [levelsWithArea, selectedLevel]);

  // Layer toggle: 2 layer riêng biệt user có thể bật/tắt & chỉnh opacity.
  //   - "district": vector polygon huyện tô màu theo maxLevel (TB toàn tỉnh).
  //   - "heat":     raster pixel-level từ Earth Engine (bản đồ nhiệt cấp cháy).
  const [layerVisible, setLayerVisible] = useState({
    district: true,
    heat: true,
  });
  const [districtOpacity, setDistrictOpacity] = useState(0.45);
  const [heatOpacity, setHeatOpacity] = useState(0.7);

  // ── Map sync — 4 effect tách biệt để KHÔNG NHÁY khi toggle/kéo slider ────
  //
  // Bí quyết (giống satellite [LayerManager] → LayerControl):
  //   - Effect A (data lifecycle): add/update source + layer khi dữ liệu đổi.
  //     KHÔNG phụ thuộc visibility → toggle visibility không tear-down.
  //   - Effect B (visibility): dùng `setLayoutProperty` — thao tác nhẹ, không
  //     tạo/xoá layer, không refetch tile.
  //   - Effect C/D (opacity): chỉ `setPaintProperty` — chỉ paint prop đổi,
  //     source + layer nguyên vẹn.
  //   - Cleanup thực sự CHỈ khi unmount (effect riêng deps=[]) — hết flicker
  //     do cleanup của Effect A chạy trên mỗi visibility change.

  // Effect A — Layer lifecycle. Add hoặc update source theo dữ liệu.
  // Không có return cleanup → không tear-down khi deps đổi.
  useEffect(() => {
    if (!mapInstance || !view) return;

    const setup = () => {
      ensureRasterLayer(mapInstance, rasterTileUrl);
      ensureDistrictLayer(mapInstance, view.districtFeatureCollection);
    };

    if (mapInstance.isStyleLoaded?.()) setup();
    else mapInstance.once("load", setup);
  }, [mapInstance, view, rasterTileUrl]);

  // Effect B — Visibility toggle. Không tear-down source/layer, chỉ set
  // `layout.visibility=visible|none`. Toggle không nháy, không refetch tile.
  useEffect(() => {
    if (!mapInstance) return;
    setLayerVisibilityOnMap(mapInstance, FIRE_RASTER_LAYER, layerVisible.heat);
    setLayerVisibilityOnMap(mapInstance, FIRE_DIST_FILL, layerVisible.district);
    setLayerVisibilityOnMap(mapInstance, FIRE_DIST_LINE, layerVisible.district);
  }, [mapInstance, layerVisible, rasterTileUrl, view]);

  // Effect C — Raster opacity. Chỉ setPaint raster layer.
  useEffect(() => {
    if (!mapInstance || !mapInstance.getLayer(FIRE_RASTER_LAYER)) return;
    mapInstance.setPaintProperty(
      FIRE_RASTER_LAYER,
      "raster-opacity",
      heatOpacity,
    );
  }, [mapInstance, heatOpacity, rasterTileUrl]);

  // Effect D — District opacity. Chỉ setPaint district fill.
  useEffect(() => {
    if (!mapInstance || !mapInstance.getLayer(FIRE_DIST_FILL)) return;
    mapInstance.setPaintProperty(
      FIRE_DIST_FILL,
      "fill-opacity",
      districtOpacity,
    );
  }, [mapInstance, districtOpacity, view]);

  // Effect E — History overlays. Sync `historyLayers` state → map layers.
  // Add cho id mới, remove cho id vừa bị xoá, update paint cho id đã có.
  useEffect(() => {
    if (!mapInstance) return;
    const apply = () => {
      // Add / update từng entry hiện tại trong state.
      for (const [id, cfg] of Object.entries(historyLayers)) {
        const item = historyItems.find((h) => h.id === id);
        if (!item?.tileUrl) continue;
        ensureHistoryRasterLayer(
          mapInstance,
          id,
          item.tileUrl,
          cfg.opacity ?? 0.5,
          cfg.visible !== false,
        );
      }
      // Xoá layer nào KHÔNG còn trong state — user bấm "remove".
      const wanted = new Set(Object.keys(historyLayers));
      const style = mapInstance.getStyle?.();
      const currentIds = (style?.layers || [])
        .map((l) => l.id)
        .filter((id) => id.startsWith(HISTORY_LAYER_PREFIX))
        .map((id) => id.slice(HISTORY_LAYER_PREFIX.length));
      for (const id of currentIds) {
        if (!wanted.has(id)) removeHistoryRasterLayer(mapInstance, id);
      }
    };
    if (mapInstance.isStyleLoaded?.()) apply();
    else mapInstance.once("load", apply);
  }, [mapInstance, historyLayers, historyItems]);

  // Effect F — Cleanup CHỈ khi unmount. Không có deps → không chạy giữa chừng.
  useEffect(() => {
    return () => {
      if (!mapInstance) return;
      removeFireLayers(mapInstance);
      // Dọn cả history overlays — không phụ thuộc state hiện tại; lấy từ style.
      const style = mapInstance.getStyle?.();
      const histIds = (style?.layers || [])
        .map((l) => l.id)
        .filter((id) => id.startsWith(HISTORY_LAYER_PREFIX))
        .map((id) => id.slice(HISTORY_LAYER_PREFIX.length));
      for (const id of histIds) removeHistoryRasterLayer(mapInstance, id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFocusMap = () => {
    if (!mapInstance) return;
    const bbox = getFeatureCollectionBbox(view?.districtFeatureCollection);
    if (bbox) {
      mapInstance.fitBounds(bbox, { padding: 40, duration: 800, maxZoom: 11 });
      return;
    }
    const c = view?.centroid;
    if (!c || Math.abs(c.lat) > 90 || Math.abs(c.lng) > 180) return;
    mapInstance.flyTo({
      center: [c.lng, c.lat],
      zoom: Math.max(mapInstance.getZoom(), 9),
      essential: true,
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const [mechExpanded, setMechExpanded] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="@container/fire flex h-full flex-col gap-3 p-3 @[360px]/fire:gap-4 @[360px]/fire:p-4">
        {/* Header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Flame className="h-5 w-5 shrink-0 text-destructive" />
              <h2 className="truncate text-base font-semibold text-foreground @[360px]/fire:text-lg">
                Cảnh báo cháy rừng
              </h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          {view?.snapshot?.analysisDate && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground @[360px]/fire:text-xs">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Ngày phân tích: {formatDateTime(view.snapshot.analysisDate)}
              </span>
            </p>
          )}
        </div>

        {/* Cơ chế dữ liệu — collapsible để tiết kiệm không gian sidebar hẹp */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 text-[11px] leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMechExpanded((v) => !v)}
            aria-expanded={mechExpanded}
            className="flex h-auto w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold text-blue-900 hover:bg-blue-100/50 dark:text-blue-200 dark:hover:bg-blue-900/20"
          >
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Cơ chế dữ liệu
            </span>
            <span className="text-[10px] font-normal text-blue-700 dark:text-blue-300">
              {mechExpanded ? "Ẩn" : "Xem"}
            </span>
          </Button>
          {mechExpanded && (
            <ul className="list-disc space-y-1 border-t border-blue-200 px-3 pt-2 pb-3 pl-7 dark:border-blue-900">
              <li>
                <b>Mô hình</b>: Random Forest 100 trees, train trên MCD64A1 +
                FireCCI51 + FIRMS (20 tháng mùa khô 2019-2023).
              </li>
              <li>
                <b>Cấp cảnh báo (C1-C5)</b>: blend NDVI + NDMI + NBR + LST +
                ERA5 + slope + fuel + Nesterov P. Không phải phân cấp thuần
                Nesterov theo QĐ 25/2022.
              </li>
              <li>
                <b>Nguồn ảnh</b>: Sentinel-2 30 ngày (cửa sổ backup 180 ngày nếu
                S2 &lt; 60% phủ), MODIS LST, ERA5-Land. Ảnh mới → cấp cảnh báo
                mới.
              </li>
            </ul>
          )}
        </div>

        {/* History browser — collapsible độc lập ngang hàng "Cơ chế dữ liệu".
            Đặt ngoài `{view && ...}` để user vẫn xem lịch sử được khi latest
            snapshot đang tính toán (view=null). `currentSnapshotId` optional. */}
        <FireRiskHistoryBrowser
          items={historyItems}
          activeIds={Object.keys(historyLayers)}
          currentSnapshotId={
            view?.snapshot?.id ? String(view.snapshot.id) : null
          }
          onAdd={(id) =>
            setHistoryLayers((s) =>
              s[id] ? s : { ...s, [id]: { visible: true, opacity: 0.6 } },
            )
          }
        />

        {loading && !view && (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {view && (
          <>
            {(view.stale || view.computing) && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                {view.computing
                  ? "Đang tính toán lại — đang hiển thị bản gần nhất."
                  : "Dữ liệu có thể đã cũ (stale)."}
              </p>
            )}

            {/* KPI — 1 cột khi hẹp, 2 cột từ 280px */}
            <div className="grid grid-cols-1 gap-2 @[280px]/fire:grid-cols-2">
              <KpiCard
                icon={<ShieldAlert className="h-3.5 w-3.5" />}
                label="Cấp Trung Bình Toàn Tỉnh"
                valueColor={
                  getRiskMeta(
                    Math.round(view.avgRiskLevel || view.maxLevel || 1),
                  ).color
                }
                value={
                  Number.isFinite(view.avgRiskLevel)
                    ? fmtNum(view.avgRiskLevel, 1)
                    : view.maxLevel > 0
                      ? `C${view.maxLevel}`
                      : "—"
                }
                hint={view.maxLevel > 0 ? `Max C${view.maxLevel}` : null}
              />
              <KpiCard
                labelNode={
                  <LabelWithTooltip
                    label="S2 phủ"
                    tip={
                      <>
                        <b>S2 phủ (Sentinel-2 coverage)</b> — tỷ lệ % diện tích
                        tỉnh có ảnh Sentinel-2 hợp lệ (đã mask mây) trong cửa sổ
                        30 ngày trước ngày phân tích. Dưới 60% nghĩa là nhiều
                        mây/thiếu ảnh → cấp cảnh báo chỉ là tham khảo, chờ ảnh
                        mới để đánh giá lại.
                      </>
                    }
                  />
                }
                value={fmtPct(view.s2CoverageRatio)}
              />
            </div>

            {/* Card cấp cảnh báo tỉnh + breakdown */}
            <Card className="gap-3 py-3 @[320px]/fire:gap-4 @[320px]/fire:py-4">
              <CardHeader className="px-3 @[320px]/fire:px-4">
                <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                  <span className="min-w-0 truncate">
                    {view.provinceName || "Tỉnh Kon Tum"}
                  </span>
                  <Badge
                    variant={getRiskMeta(view.maxLevel || 1).badge}
                    className="ml-auto whitespace-nowrap"
                  >
                    {getRiskMeta(view.maxLevel || 1).label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-3 @[320px]/fire:px-4">
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                    Diện tích theo cấp
                  </p>
                  {levelsWithArea.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      Không có ha theo cấp
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {levelsWithArea.map((l) => {
                        const meta = getRiskMeta(l.level);
                        const isFocused =
                          selectedLevel !== ALL_VALUE &&
                          String(l.level) === selectedLevel;
                        return (
                          <span
                            key={l.level}
                            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] tabular-nums transition-opacity ${
                              selectedLevel !== ALL_VALUE && !isFocused
                                ? "opacity-40"
                                : "opacity-100"
                            }`}
                            style={{
                              borderColor: meta.color,
                              color: meta.color,
                            }}
                            title={meta.label}
                          >
                            <span
                              className="inline-block h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: meta.color }}
                            />
                            C{l.level} · {fmtHa(l.ha)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bảng huyện — mỗi huyện: max cấp + ha ở cấp đó, dòng dưới tổng+meta */}
            {view.districts.length > 0 && (
              <Card className="gap-2 py-3">
                <CardHeader className="flex flex-row items-center justify-between px-3 py-1 @[320px]/fire:px-4">
                  <CardTitle className="text-sm">Theo huyện</CardTitle>
                  <span className="text-[10px] text-muted-foreground">
                    {view.districts.length} huyện
                  </span>
                </CardHeader>
                <CardContent className="px-3 pb-3 @[320px]/fire:px-4">
                  {/* NOTE — chỉ hiển thị 3 field cần: tên huyện, ha ở cấp cao
                      nhất, s2Coverage. Bỏ tổng ha, breakdown per level, code —
                      user quyết định giữ UI gọn. */}
                  <ul className="divide-y divide-border/60">
                    {[...view.districts]
                      .sort(
                        (a, b) =>
                          b.maxLevel - a.maxLevel ||
                          b.topLevelHa - a.topLevelHa,
                      )
                      .map((d) => {
                        const meta = getRiskMeta(d.maxLevel || 1);
                        return (
                          <li
                            key={d.unitCode ?? d.name}
                            className="flex items-center gap-2 py-2"
                          >
                            <span
                              className="min-w-0 flex-1 truncate text-[12px] font-medium"
                              title={d.name}
                            >
                              {d.name}
                            </span>
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums whitespace-nowrap"
                              style={{
                                color: meta.color,
                                backgroundColor: `${meta.color}22`,
                              }}
                              title={meta.label}
                            >
                              {d.maxLevel > 0 ? `C${d.maxLevel}` : "—"} ·{" "}
                              {fmtHa(d.topLevelHa)}
                            </span>
                            <span
                              className="text-[10px] tabular-nums whitespace-nowrap text-muted-foreground"
                              title="Sentinel-2 coverage"
                            >
                              S2 {fmtPct(d.s2Coverage)}
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Layer manager — gồm 2 lớp cố định (district + heat) + N overlay
                history user add từ browser bên dưới. Header có Refresh (fetch
                lại snapshot) + Đặt lại mặc định (reset visibility/opacity +
                gỡ hết overlay history). */}
            <FireRiskLayerManager
              districtFeatureCollection={view.districtFeatureCollection}
              rasterTileUrl={rasterTileUrl}
              geeDownloadUrl={view.geeDownloadUrl}
              geeDownloadFilename={view.geeDownloadFilename}
              layerVisible={layerVisible}
              onLayerToggle={(id) =>
                setLayerVisible((s) => ({ ...s, [id]: !s[id] }))
              }
              districtOpacity={districtOpacity}
              heatOpacity={heatOpacity}
              onDistrictOpacityChange={setDistrictOpacity}
              onHeatOpacityChange={setHeatOpacity}
              historyRows={Object.entries(historyLayers)
                .map(([id, cfg]) => {
                  const item = historyItems.find((h) => h.id === id);
                  if (!item) return null;
                  return {
                    id,
                    geoserverLayer: item.geoserverLayer,
                    dateStr: item.analysisDate
                      ? String(item.analysisDate).slice(0, 10)
                      : id,
                    visible: cfg.visible !== false,
                    opacity: cfg.opacity ?? 0.6,
                  };
                })
                .filter(Boolean)}
              onHistoryToggle={(id) =>
                setHistoryLayers((s) =>
                  s[id]
                    ? {
                        ...s,
                        [id]: { ...s[id], visible: !(s[id].visible !== false) },
                      }
                    : s,
                )
              }
              onHistoryOpacityChange={(id, opacity) =>
                setHistoryLayers((s) =>
                  s[id] ? { ...s, [id]: { ...s[id], opacity } } : s,
                )
              }
              onHistoryRemove={(id) =>
                setHistoryLayers((s) => {
                  const { [id]: _, ...rest } = s;
                  return rest;
                })
              }
              onResetDefaults={() => {
                setLayerVisible({ district: true, heat: true });
                setDistrictOpacity(0.45);
                setHeatOpacity(0.7);
                setHistoryLayers({});
              }}
            />

            {/* History browser đã move lên trên (ngang "Cơ chế dữ liệu"). */}

            {/* Chú giải cấp — 1 cột khi hẹp, 2 cột khi rộng */}
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <p className="mb-2 text-[11px] font-semibold text-muted-foreground">
                Chú giải cấp cháy
              </p>
              <div className="grid grid-cols-1 gap-1.5 @[380px]/fire:grid-cols-2">
                {[1, 2, 3, 4, 5].map((l) => {
                  const meta = getRiskMeta(l);
                  return (
                    <div
                      key={l}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="truncate">{meta.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                <ThermometerSun className="h-3 w-3 shrink-0" />
                <span>
                  Cấp 0 (không hiển thị): thiếu quan sát S2/LST 30 ngày.
                </span>
              </div>
            </div>
          </>
        )}

        {!loading && !error && !view && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Flame className="h-10 w-10 opacity-30" />
            <p className="text-sm">Chưa có dữ liệu cảnh báo cháy rừng</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Layer manager tối giản cho Fire Risk. 2 layer cố định:
 *   1. Vector polygon huyện — download geojson.
 *   2. Raster nhiệt cấp cháy — copy tile URL + tải GeoTIFF clip theo tỉnh.
 *
 * Mỗi row: dot + name + eye + download + slider inline. Không header
 * collapsible, không stats panel, không description dài dòng.
 */
function FireRiskLayerManager({
  geeDownloadUrl,
  geeDownloadFilename,
  layerVisible,
  onLayerToggle,
  districtOpacity,
  heatOpacity,
  onDistrictOpacityChange,
  onHeatOpacityChange,
  historyRows = [],
  onHistoryToggle,
  onHistoryOpacityChange,
  onHistoryRemove,
  onResetDefaults,
}) {
  // 2 lớp cố định + N lớp history (append động khi user add từ history browser).
  const baseRows = [
    {
      id: "district",
      label: "Ranh giới huyện",
      dot: "bg-primary",
      visible: layerVisible.district,
      opacity: districtOpacity,
      onToggle: () => onLayerToggle("district"),
      onOpacityChange: onDistrictOpacityChange,
      rasterUrl: null,
      downloadFilename: null,
    },
    {
      id: "heat",
      // Đổi tên rõ ràng: đây là raster CẤP CẢNH BÁO CHÁY (0-5), không phải
      // nhiệt độ đo đạc — tránh nhầm với LST/MODIS.
      label: "Bản đồ nhiệt cấp cảnh báo cháy",
      dot: "bg-orange-500",
      visible: layerVisible.heat,
      opacity: heatOpacity,
      onToggle: () => onLayerToggle("heat"),
      onOpacityChange: onHeatOpacityChange,
      rasterUrl: geeDownloadUrl,
      downloadFilename: geeDownloadFilename,
    },
  ];

  // History rows chuyển thành cùng shape với base — cho FireRiskLayerRow render
  // đồng nhất. Nút "×" (removable) chỉ hiện với history rows để user có thể
  // gỡ overlay đã add, không áp dụng cho district/heat cố định.
  const historyLayerRows = historyRows.map((h) => ({
    id: `hist-${h.id}`,
    label: `Bản đồ nhiệt ${h.dateStr}`,
    dot: "bg-slate-400",
    visible: h.visible !== false,
    opacity: h.opacity ?? 0.6,
    onToggle: () => onHistoryToggle?.(h.id),
    onOpacityChange: (v) => onHistoryOpacityChange?.(h.id, v),
    rasterUrl: null,
    downloadFilename: null,
    removable: true,
    onRemove: () => onHistoryRemove?.(h.id),
    title: h.geoserverLayer,
  }));

  const rows = [...baseRows, ...historyLayerRows];

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      {/* Header: "Lớp bản đồ" trái | Reset phải (justify-between). Tooltip
          radix — hover 200ms hiện ngoài viewport, không bị input `title` bao
          quanh 1 dòng. */}
      <div className="mb-1 flex items-center justify-between gap-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold">Lớp bản đồ</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onResetDefaults}
              aria-label="Đặt lại mặc định"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-55">
            Đặt lại visibility + opacity mặc định và gỡ hết overlay history đã thêm.
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="space-y-1">
        {rows.map((r) => (
          <FireRiskLayerRow key={r.id} row={r} />
        ))}
      </div>
    </div>
  );
}

/** 1 hàng compact: dot + name + eye + [tải-tif] + [×] + slider.
 *  `row.removable=true` → thêm nút × để gỡ overlay (dành cho history rows).
 *  Slider LUÔN full-width bất kể visibility — user vẫn chỉnh được opacity khi
 *  lớp đang ẩn (giá trị persist khi bật lại). Trước đây dùng `disabled` khi
 *  ẩn → browser default fade + thu ngắn track ("slider bị co lại"). */
function FireRiskLayerRow({ row }) {
  return (
    <div
      className={`rounded border border-border/60 bg-background/40 p-1.5 transition-opacity ${row.visible ? "" : "opacity-60"}`}
    >
      <div className="flex items-center gap-1.5">
        <div className={`h-2 w-2 shrink-0 rounded-full ${row.dot}`} />
        {/* Radix Tooltip — sidebar hẹp thường truncate tên; hover hiện full
            name + layer FQN (nếu khác label, ví dụ history overlay). */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="min-w-0 flex-1 cursor-help truncate text-[11px] font-medium">
              {row.label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-72">
            <p className="font-semibold">{row.label}</p>
            {row.title && row.title !== row.label && (
              <p className="mt-1 font-mono text-[10px] opacity-75">{row.title}</p>
            )}
          </TooltipContent>
        </Tooltip>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={row.onToggle}
          title={row.visible ? "Ẩn" : "Hiện"}
        >
          {row.visible ? (
            <Eye className="h-3.5 w-3.5 text-primary" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
        {row.rasterUrl && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={async () => {
              // Fetch → blob → <a download> để ép filename từ server thay vì
              // để GEE URL trả `<hash>:getPixels.tiff`. Fallback: tab mới
              // nếu CORS block hoặc URL expired.
              const filename = row.downloadFilename || "fire_risk.tif";
              try {
                const res = await fetch(row.rasterUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = objectUrl;
                a.download = filename;
                a.click();
                setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
              } catch (err) {
                console.warn("[FireRisk] blob download failed:", err?.message);
                window.open(row.rasterUrl, "_blank", "noopener");
              }
            }}
            title={`Tải GeoTIFF màu (${row.downloadFilename || "TTL 24h"})`}
          >
            <Image className="h-3.5 w-3.5 text-primary" />
          </Button>
        )}
        {row.removable && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={row.onRemove}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Gỡ overlay này khỏi bản đồ"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={row.opacity}
        onChange={(e) => row.onOpacityChange(Number(e.target.value))}
        className="mt-1 block w-full accent-primary"
        title={`Độ trong suốt: ${Math.round(row.opacity * 100)}%`}
      />
    </div>
  );
}

/**
 * Browser lịch sử snapshot đã publish — collapsible giống pattern "Cơ chế
 * dữ liệu": header toggle Xem/Ẩn, body chứa search + list. Body chỉ mount khi
 * expanded → tiết kiệm layout khi sidebar hẹp.
 *
 * Row hành vi:
 *   - Item current snapshot bị disable (đã hiển thị mặc định).
 *   - Item chưa thêm: nút "+ Thêm" → gọi onAdd(id) → parent append vào
 *     section "Lớp bản đồ".
 *   - Item đã thêm: nút "Đã thêm" (disabled); gỡ overlay bằng × trong Lớp
 *     bản đồ, không phải ở đây.
 *
 * Server đã filter chỉ trả snapshot có geoserver_layer (hasGeoserverLayer=true)
 * → mọi item ở đây đều publish được, không phải guard client.
 */
function FireRiskHistoryBrowser({
  items,
  activeIds,
  currentSnapshotId,
  onAdd,
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const dateStr = it.analysisDate
        ? String(it.analysisDate).slice(0, 10)
        : "";
      const layer = String(it.geoserverLayer || "").toLowerCase();
      return dateStr.includes(q) || layer.includes(q);
    });
  }, [items, query]);

  // KHÔNG return null khi items=[] — vẫn render header + empty state để user
  // luôn thấy section có tồn tại (giúp debug: nếu server chưa publish snapshot
  // nào, user thấy thông báo thay vì UI biến mất khó hiểu).
  const activeSet = new Set(activeIds || []);
  const isEmpty = !items?.length;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 text-[11px] leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
      {/* Header collapsible — cùng skin "Cơ chế dữ liệu" (blue theme) để user
          nhận ra section quan trọng, không bị chìm vào các card border-border. */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => !isEmpty && setExpanded((v) => !v)}
        disabled={isEmpty}
        aria-expanded={expanded && !isEmpty}
        className="flex h-auto w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold text-blue-900 hover:bg-blue-100/50 dark:text-blue-200 dark:hover:bg-blue-900/20"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          Lịch sử cảnh báo cháy rừng
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-normal text-blue-700 dark:text-blue-300">
          <span className="tabular-nums">{items?.length ?? 0}</span>
          <span>{isEmpty ? "Trống" : expanded ? "Ẩn" : "Xem"}</span>
        </span>
      </Button>

      {isEmpty && (
        <div className="border-t border-blue-200 px-3 py-2 text-[10px] text-blue-700 dark:border-blue-900 dark:text-blue-300">
          Chưa có snapshot nào đã publish GeoServer. Chạy phân tích + publish từ
          admin để add layer cũ vào bản đồ.
        </div>
      )}

      {expanded && !isEmpty && (
        <div className="border-t border-blue-200 dark:border-blue-900">
          {/* Search — filter theo ngày (YYYY-MM-DD) hoặc tên layer WMS. */}
          <div className="px-3 pt-2 pb-1">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo ngày hoặc tên layer..."
                className="w-full rounded border border-blue-300 bg-white py-1 pr-6 pl-6 text-[11px] text-blue-900 outline-none placeholder:text-blue-400 focus:border-blue-500 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100 dark:placeholder:text-blue-600"
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/40"
                  title="Xoá tìm kiếm"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            {query && (
              <p className="mt-1 text-[10px] text-blue-700 tabular-nums dark:text-blue-300">
                {filtered.length}/{items.length} khớp
              </p>
            )}
          </div>

          {/* List — max-h giới hạn để card không phình khi có nhiều tháng. */}
          <ul className="max-h-56 divide-y divide-blue-200 overflow-y-auto border-t border-blue-200 dark:divide-blue-900 dark:border-blue-900">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-[11px] text-blue-700 dark:text-blue-300">
                Không có snapshot khớp "{query}"
              </li>
            ) : (
              filtered.map((it) => {
                const isCurrent = it.id === currentSnapshotId;
                const added = activeSet.has(it.id);
                const dateStr = it.analysisDate
                  ? String(it.analysisDate).slice(0, 10)
                  : it.id;
                return (
                  <li
                    key={it.id}
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <span
                      className="flex-1 truncate tabular-nums"
                      title={it.geoserverLayer}
                    >
                      {dateStr}
                      {isCurrent && (
                        <span className="ml-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                          (hiện tại)
                        </span>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => !isCurrent && !added && onAdd(it.id)}
                      disabled={isCurrent || added}
                      className={`shrink-0 text-[10px] ${
                        added
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : isCurrent
                            ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
                            : "border-blue-400 bg-white text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/40"
                      }`}
                      title={
                        isCurrent
                          ? "Snapshot hiện tại — đã render mặc định trong 'Bản đồ nhiệt cấp cảnh báo cháy'. Add lại sẽ chồng 2 lớp WMS trùng nhau."
                          : added
                            ? "Đã thêm vào Lớp bản đồ. Gỡ bằng nút × ở trên."
                            : "Thêm overlay vào Lớp bản đồ"
                      }
                    >
                      {isCurrent
                        ? "Đang hiển thị"
                        : added
                          ? "Đã thêm"
                          : (
                            <>
                              <Plus className="h-3 w-3" />
                              Thêm
                            </>
                          )}
                    </Button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, labelNode, value, valueColor, hint }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-2.5 @[320px]/fire:p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground @[320px]/fire:text-xs">
        {icon}
        {labelNode ?? <span>{label}</span>}
      </div>
      <p
        className="mt-1 truncate text-base font-bold tabular-nums @[320px]/fire:text-lg"
        style={valueColor ? { color: valueColor } : undefined}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </p>
      {hint && (
        <p
          className="mt-0.5 truncate text-[10px] text-muted-foreground"
          title={hint}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export default MonitoringAndAlerting;
