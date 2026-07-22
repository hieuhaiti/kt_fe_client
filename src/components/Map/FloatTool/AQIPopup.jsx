import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapStore } from "@/stores/Map/useMapStore";
import { useMapStyleStore } from "@/stores/Map/Sidebar/useMapStyleStore";
import { useAQI } from "@/features/weather/openWeatherMap/useWeather";
import { AQI_LEVELS } from "@/features/weather/openWeatherMap/weatherHelpers";

export function AQIPopup() {
  const popupRef = useRef(null);
  const markerRef = useRef(null);
  const { mapInstance, clickedPoint, clearClickedPoint } = useMapStore();
  const clickedPointMode = useMapStyleStore((s) => s.clickedPointMode);

  // Fetch AQI data based on clicked point
  const {
    data: aqiData,
    isLoading,
    isError,
  } = useAQI(clickedPoint?.lat, clickedPoint?.lng);

  // Create/update popup when clickedPoint changes
  useEffect(() => {
    if (!mapInstance || !clickedPoint) {
      // Clean up existing popup and marker
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    // Verify map is ready
    if (!mapInstance.isStyleLoaded()) {
      console.warn("⚠️  Map style not loaded yet");
      return;
    }

    // Create marker
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "aqi-marker";
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: var(--primary);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      `;

      try {
        markerRef.current = new mapboxgl.Marker(el)
          .setLngLat([clickedPoint.lng, clickedPoint.lat])
          .addTo(mapInstance);
      } catch (error) {
        console.error("Error creating marker:", error);
        return;
      }
    } else {
      markerRef.current.setLngLat([clickedPoint.lng, clickedPoint.lat]);
    }

    // Create popup content
    const popupContent = createPopupContent(
      clickedPoint,
      aqiData,
      isLoading,
      isError,
    );

    // Create or update popup
    if (!popupRef.current) {
      try {
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          offset: 25,
          className: "aqi-popup",
        })
          .setLngLat([clickedPoint.lng, clickedPoint.lat])
          .setHTML(popupContent)
          .addTo(mapInstance);

        popupRef.current.on("close", () => {
          clearClickedPoint();
        });
      } catch (error) {
        console.error("Error creating popup:", error);
        return;
      }
    } else {
      popupRef.current
        .setLngLat([clickedPoint.lng, clickedPoint.lat])
        .setHTML(popupContent);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [
    mapInstance,
    clickedPoint,
    aqiData,
    isLoading,
    isError,
    clearClickedPoint,
  ]);

  // Cleanup when mode is turned off
  useEffect(() => {
    if (!clickedPointMode) {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [clickedPointMode]);

  return null; // This component doesn't render anything in React
}

function createPopupContent(clickedPoint, aqiData, isLoading, isError) {
  const containerStyle = `
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    color: #1f2937;
    max-width: 300px;
    min-width: 240px;
    width: 100%;
  `;

  const { lat, lng } = clickedPoint;

  // --- 1. Loading State UI ---
  if (isLoading) {
    return `
      <div style="${containerStyle}; padding: 16px 36px 16px 16px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <div class="loading-spinner" style="flex-shrink: 0; width: 18px; height: 18px; border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span style="font-size: 13px; color: #6b7280; font-weight: 500;">Đang tải...</span>
        </div>
        <div style="width: 100%; padding-bottom: 30%; background: #f3f4f6; border-radius: 8px; animation: pulse 2s cubic-bezier(0.4.6, 1) infinite;"></div>
      </div>
    `;
  }

  // --- 2. Error State UI ---
  if (isError || !aqiData) {
    return `
      <div style="${containerStyle}; padding: 16px 36px 16px 16px;">
        <div style="display: flex; align-items: center; gap: 8px; color: #ef4444; margin-bottom: 8px; flex-wrap: wrap;">
          <svg style="flex-shrink: 0;" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span style="font-weight: 600; font-size: 14px;">Lỗi tải dữ liệu</span>
        </div>
        <div style="font-size: 12px; color: #6b7280; word-break: break-word;">
          Không thể lấy chỉ số AQI.
        </div>
      </div>
    `;
  }

  // --- 3. Data Processing ---
  const components = aqiData?.list?.[0]?.components || {};
  const aqiIndex = aqiData?.list?.[0]?.main?.aqi || 0;
  const defaultAQI = { label: "Không xác định", color: "#9ca3af", desc: "N/A" };
  const aqiInfo = AQI_LEVELS[aqiIndex] || defaultAQI;

  const colorHexMap = {
    "text-green-600": "#10b981",
    "text-yellow-600": "#f59e0b",
    "text-orange-600": "#f97316",
    "text-red-600": "#ef4444",
    "text-purple-600": "#8b5cf6",
    "text-maroon-600": "#991b1b",
  };
  const themeColor = colorHexMap[aqiInfo.color] || "#6b7280";
  const bgColor = themeColor.startsWith("#")
    ? `${themeColor}15`
    : "rgba(0,0,0,0.05)";
  const formatVal = (val) => (val !== undefined ? val.toFixed(1) : "--");

  // --- 4. Render Flexible UI ---
  return `
    <div style="${containerStyle}">

      <div style="padding: 16px 36px 12px 16px; border-bottom: 1px solid #f3f4f6;">
        <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">Chất lượng không khí</div>
        <div style="font-size: 11px; color: #9ca3af; display: flex; gap: 6px; flex-wrap: wrap;">
           <span style="white-space: nowrap;">Lat: ${lat.toFixed(4)}</span>
           <span style="color: #d1d5db;">|</span>
           <span style="white-space: nowrap;">Lng: ${lng.toFixed(4)}</span>
        </div>
      </div>

      <div style="margin: 12px 16px;">
        <div style="
          padding: 12px;
          background: ${bgColor};
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid ${themeColor}30;
        ">
          <div style="
            flex-shrink: 0;
            width: 42px; height: 42px;
            background: ${themeColor};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: 800; font-size: 18px;
            box-shadow: 0 2px 4px ${themeColor}40;
          ">
            ${aqiIndex}
          </div>

          <div style="flex: 1; min-width: 0;">
            <div style="
              font-weight: 700;
              color: ${themeColor};
              font-size: 16px;
              line-height: 1.2;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">
              ${aqiInfo.label}
            </div>
            <div style="font-size: 11px; color: #4b5563; margin-top: 2px; opacity: 0.8; word-break: break-word;">
              ${aqiInfo.desc || ""}
            </div>
          </div>
        </div>
      </div>

      <div style="padding: 0 16px 16px 16px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${renderMetricItem("PM2.5", formatVal(components.pm2_5), "µg/m³")}
          ${renderMetricItem("PM10", formatVal(components.pm10), "µg/m³")}
          ${renderMetricItem("CO", formatVal(components.co), "µg/m³")}
          ${renderMetricItem("O₃", formatVal(components.o3), "µg/m³")}
        </div>
      </div>

    </div>
  `;
}

function renderMetricItem(label, value, unit) {
  return `
    <div style="
      background: #f9fafb;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-width: 100%;
      box-sizing: border-box;
    ">
      <div style="font-size: 10px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
        ${label}
      </div>
      <div style="display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap;">
        <span style="font-weight: 700; font-size: 14px; color: #1f2937; word-break: break-all; line-height: 1.2;">
          ${value}
        </span>
        <span style="font-size: 10px; color: #9ca3af; white-space: nowrap;">
          ${unit}
        </span>
      </div>
    </div>
  `;
}
