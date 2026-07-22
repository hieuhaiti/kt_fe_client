import { useEffect, useMemo, useRef } from "react";
import { useWeatherLayerStore } from "@/stores/Map/Sidebar/useWeatherLayerStore";
import { useMapStore } from "@/stores/Map/useMapStore";
import {
  buildWeatherTileUrl,
  getWeatherWindGrid,
} from "@/services/weatherService";


const RASTER_LAYER_IDS = ["rain", "temp", "cloud", "pressure"];

const RASTER_OPACITY = {
  rain: 0.55,
  temp: 0.38,
  cloud: 0.32,
  pressure: 0.35,
};

const BOUNDARY_SOURCE_ID = "weather-boundary-source";
const BOUNDARY_OUTLINE_ID = "weather-boundary-outline";
const BOUNDARY_MAIN_ID = "weather-boundary-main";
const boundaryGeojson = null;
const WIND_ANIMATION_CONFIG = {
  targetFps: 28,
  speedMultiplier: 0.55,
  minStep: 0.55,
  maxStep: 4.2,
};

function speedColor(speed, alpha) {
  if (speed < 1) return `rgba(255,255,255,${alpha})`;
  if (speed < 3) return `rgba(80,180,255,${alpha})`;
  if (speed < 6) return `rgba(0,255,170,${alpha})`;
  if (speed < 10) return `rgba(170,255,0,${alpha})`;
  if (speed < 15) return `rgba(255,230,0,${alpha})`;
  if (speed < 22) return `rgba(255,140,0,${alpha})`;
  if (speed < 30) return `rgba(255,60,60,${alpha})`;
  return `rgba(255,0,255,${alpha})`;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function clearCanvas(canvas) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Thay cho useWindyOverlay cũ.
 * - Không còn iframe Windy / postMessage. Raster (mưa/nhiệt độ/mây/áp suất)
 *   được add trực tiếp vào map Mapbox hiện có.
 * - Gió được vẽ bằng canvas streamlines (particle animation, nội suy IDW từ
 *   lưới điểm gió Open-Meteo) - đúng cách làm trong kontum_windy_style_streamlines.html.
 * - Nhiều lớp có thể bật cùng lúc (không còn giới hạn 1 overlay như Windy widget).
 *
 * @param {*} mapRef - ref tới map Mapbox (giữ nguyên pattern cũ: .single || trực tiếp)
 * @param {*} canvasRef - ref tới <canvas> phủ lên trên map, dùng để vẽ streamlines gió
 */
export const useWeatherOverlay = (mapRef, canvasRef) => {
  const weatherLayers = useWeatherLayerStore((s) => s.weatherLayers);
  const mapInstance = useMapStore((s) => s.mapInstance);

  const enabledLayers = useMemo(
    () => weatherLayers.filter((l) => l.enabled),
    [weatherLayers],
  );

  const windEnabled = useMemo(
    () => weatherLayers.some((l) => l.id === "wind" && l.enabled),
    [weatherLayers],
  );

  const getMap = () => {
    const current = mapRef?.current;
    const refMap =
      current && Object.prototype.hasOwnProperty.call(current, "single")
        ? current.single
        : current;
    const map = refMap || mapInstance;

    return map &&
      typeof map.isStyleLoaded === "function" &&
      typeof map.getContainer === "function"
      ? map
      : null;
  };

  // ---------------------------------------------------------------------
  // 1) Raster layers (mưa / nhiệt độ / mây / áp suất) - add/remove thẳng
  //    trên map chính theo trạng thái store, không cần postMessage.
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = getMap();
    if (!map) return;

    const applyRasterLayers = () => {
      RASTER_LAYER_IDS.forEach((id) => {
        const layer = weatherLayers.find((l) => l.id === id);
        if (!layer) return;

        const sourceId = `${id}-source`;
        const layerId = `${id}-layer`;
        const hasLayer = !!map.getLayer(layerId);

        if (layer.enabled && !hasLayer) {
          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
              type: "raster",
              tiles: [buildWeatherTileUrl(layer.weather_type || layer.id)],
              tileSize: 256,
            });
          }
          map.addLayer({
            id: layerId,
            type: "raster",
            source: sourceId,
            paint: {
              "raster-opacity": RASTER_OPACITY[id] ?? 0.4,
              "raster-fade-duration": 400,
            },
          });
        } else if (!layer.enabled && hasLayer) {
          map.removeLayer(layerId);
        }
      });
    };

    if (map.isStyleLoaded()) {
      applyRasterLayers();
    } else {
      map.once("load", applyRasterLayers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherLayers, mapInstance]);

  // ---------------------------------------------------------------------
  // 2) Boundary (ranh giới khu vực) - vẽ 1 lần, chỉ hiện khi có ít nhất
  //    1 lớp thời tiết đang bật (thay cho SET_GEOMETRY gửi qua iframe cũ).
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = getMap();
    if (!map) return;

    const ensureBoundaryLayers = () => {
      if (!boundaryGeojson) return;

      if (!map.getSource(BOUNDARY_SOURCE_ID)) {
        map.addSource(BOUNDARY_SOURCE_ID, {
          type: "geojson",
          data: boundaryGeojson,
        });
      }
      if (!map.getLayer(BOUNDARY_OUTLINE_ID)) {
        map.addLayer({
          id: BOUNDARY_OUTLINE_ID,
          type: "line",
          source: BOUNDARY_SOURCE_ID,
          paint: {
            "line-color": "#000000",
            "line-width": 5,
            "line-opacity": 0.9,
          },
        });
      }
      if (!map.getLayer(BOUNDARY_MAIN_ID)) {
        map.addLayer({
          id: BOUNDARY_MAIN_ID,
          type: "line",
          source: BOUNDARY_SOURCE_ID,
          paint: {
            "line-color": "#00E5FF",
            "line-width": 2,
            "line-opacity": 1,
          },
        });
      }

      const visibility = enabledLayers.length > 0 ? "visible" : "none";
      map.setLayoutProperty(BOUNDARY_OUTLINE_ID, "visibility", visibility);
      map.setLayoutProperty(BOUNDARY_MAIN_ID, "visibility", visibility);
    };

    if (map.isStyleLoaded()) {
      ensureBoundaryLayers();
    } else {
      map.once("load", ensureBoundaryLayers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledLayers.length, mapInstance]);

  // ---------------------------------------------------------------------
  // 3) Wind streamlines (canvas particle animation, nội suy IDW từ lưới
  //    điểm gió Open-Meteo) - port trực tiếp từ kontum_windy_style_streamlines.html
  // ---------------------------------------------------------------------
  const particlesRef = useRef([]);
  const windGridRef = useRef([]);
  const rafIdRef = useRef(null);
  const intervalRef = useRef(null);
  const lastWindFrameTimeRef = useRef(0);

  const makeParticle = (w, h) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    age: Math.random() * 120,
    maxAge: 70 + Math.random() * 120,
  });

  const resizeCanvas = () => {
    const canvas = canvasRef?.current;
    const map = getMap();
    if (!canvas || !map) return;
    const container = map.getContainer();
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    particlesRef.current = Array.from({ length: 1800 }, () =>
      makeParticle(canvas.width, canvas.height),
    );
  };

  const getLocalWind = (screenX, screenY) => {
    const map = getMap();
    const grid = windGridRef.current;
    if (!map || !grid.length) return { u: 0, v: 0, speed: 0 };

    const lngLat = map.unproject([screenX, screenY]);

    let sumW = 0;
    let sumU = 0;
    let sumV = 0;
    let sumSpeed = 0;

    for (const g of grid) {
      const dLon = lngLat.lng - (g.lng ?? g.lon);
      const dLat = lngLat.lat - g.lat;
      const dist2 = dLon * dLon + dLat * dLat + 0.00001;
      const weight = 1 / dist2;

      // wind_direction_10m của Open-Meteo là hướng gió THỔI TỪ.
      // Streamline cần hướng gió THỔI ĐẾN nên +180 độ.
      const u = Number(g.u || 0);
      const v = Number(g.v || 0);
      const speed = Number(g.speed || 0);

      sumU += u * weight;
      sumV += v * weight;
      sumSpeed += speed * weight;
      sumW += weight;
    }

    return { u: sumU / sumW, v: sumV / sumW, speed: sumSpeed / sumW };
  };

  // Lưu ý: mỗi điểm lưới = 1 lần fetch Open-Meteo. Với lưới lớn / map nhiều
  // người dùng cùng lúc nên cân nhắc cache hoặc proxy qua backend riêng.
  const updateWindGrid = async () => {
    const map = getMap();
    if (!map) return;
    const b = map.getBounds();

    try {
      const bbox = [
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth(),
      ].join(",");
      const response = await getWeatherWindGrid({ bbox, grid: 8 });
      windGridRef.current = response?.data?.points || [];
    } catch {
      windGridRef.current = [];
    }
  };

  const drawFrame = () => {
    const now = performance.now();
    const minFrameDuration = 1000 / WIND_ANIMATION_CONFIG.targetFps;

    if (now - lastWindFrameTimeRef.current < minFrameDuration) {
      rafIdRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    lastWindFrameTimeRef.current = now;

    const canvas = canvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Làm mờ dần frame trước (hiệu ứng vệt streamline)
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = "rgba(0,0,0,0.90)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";

    for (const p of particlesRef.current) {
      const w = getLocalWind(p.x, p.y);
      const mag = Math.sqrt(w.u * w.u + w.v * w.v) || 1;
      const dx = w.u / mag;
      const dy = w.v / mag;
      const move =
        WIND_ANIMATION_CONFIG.minStep +
        Math.min(
          WIND_ANIMATION_CONFIG.maxStep,
          w.speed * WIND_ANIMATION_CONFIG.speedMultiplier,
        );

      const x1 = p.x;
      const y1 = p.y;
      const x2 = x1 + dx * move;
      const y2 = y1 + dy * move;

      ctx.beginPath();
      ctx.strokeStyle = speedColor(w.speed, 0.88);
      ctx.lineWidth = Math.min(3.4, 1.1 + w.speed / 5);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      p.x = x2;
      p.y = y2;
      p.age++;

      if (
        p.age > p.maxAge ||
        p.x < -50 ||
        p.x > canvas.width + 50 ||
        p.y < -50 ||
        p.y > canvas.height + 50
      ) {
        const np = makeParticle(canvas.width, canvas.height);
        p.x = np.x;
        p.y = np.y;
        p.age = 0;
        p.maxAge = np.maxAge;
      }
    }

    rafIdRef.current = requestAnimationFrame(drawFrame);
  };

  useEffect(() => {
    const map = getMap();
    const canvas = canvasRef?.current;
    if (!map || !canvas) return;

    if (!windEnabled) {
      // Tắt: dừng animation + xoá canvas
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearCanvas(canvas);
      return;
    }

    resizeCanvas();
    lastWindFrameTimeRef.current = 0;
    updateWindGrid();
    intervalRef.current = setInterval(updateWindGrid, 10 * 60 * 1000);

    const onMoveEnd = debounce(updateWindGrid, 700);
    const onMoveStart = () => {
      clearCanvas(canvas);
    };

    map.on("moveend", onMoveEnd);
    map.on("movestart", onMoveStart);
    map.on("resize", resizeCanvas);

    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    rafIdRef.current = requestAnimationFrame(drawFrame);

    return () => {
      map.off("moveend", onMoveEnd);
      map.off("movestart", onMoveStart);
      map.off("resize", resizeCanvas);
      resizeObserver.disconnect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearCanvas(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windEnabled, mapInstance]);

  return { enabledLayers, windEnabled };
};
