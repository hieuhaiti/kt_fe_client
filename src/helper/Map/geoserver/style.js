import { STYLE_PROPERTY_DEFINITIONS } from "../../../constant/mapLayerStyle.js";
import { GEOSERVER_POINT_PAINT } from "../../../constant/geoserverData.js";

const HEX_COLOR = /^#(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

/**
 * Returns default opacity for raster layer based on category or default.
 */
export function getDefaultRasterOpacity(layerOrStyle) {
  const style = layerOrStyle?.default_style || layerOrStyle || {};
  const val = style?.rasterOpacity ?? style?.raster_opacity ?? style?.opacity;
  if (isFiniteNumber(val)) return clamp(val, 0, 1);
  if (layerOrStyle?.category === "flood" || layerOrStyle?.category === "fire_risk") return 0.88;
  return 0.72;
}

/**
 * Normalizes any raw style object (camelCase, snake_case or nested) into a clean format.
 * Returns an object that exposes both direct properties and `{ style, error: null }` for backward compatibility.
 */
export function normalizeDefaultStyle(rawStyle) {
  if (!rawStyle || typeof rawStyle !== "object" || Array.isArray(rawStyle)) {
    const empty = {};
    empty.style = {};
    empty.error = null;
    return empty;
  }
  const s = rawStyle.style && typeof rawStyle.style === "object" ? rawStyle.style : rawStyle;

  const result = {};

  // Colors
  if (s.fillColor || s.fill_color) result.fillColor = s.fillColor || s.fill_color;
  if (s.strokeColor || s.stroke_color || s.color) result.strokeColor = s.strokeColor || s.stroke_color || s.color;
  if (s.circleColor || s.circle_color) result.circleColor = s.circleColor || s.circle_color;
  if (s.circleStrokeColor || s.circle_stroke_color) result.circleStrokeColor = s.circleStrokeColor || s.circle_stroke_color;

  // Opacity
  if (s.fillOpacity !== undefined || s.fill_opacity !== undefined) result.fillOpacity = Number(s.fillOpacity ?? s.fill_opacity);
  if (s.strokeOpacity !== undefined || s.stroke_opacity !== undefined) result.strokeOpacity = Number(s.strokeOpacity ?? s.stroke_opacity);
  if (s.circleOpacity !== undefined || s.circle_opacity !== undefined) result.circleOpacity = Number(s.circleOpacity ?? s.circle_opacity);
  if (s.circleStrokeOpacity !== undefined || s.circle_stroke_opacity !== undefined) result.circleStrokeOpacity = Number(s.circleStrokeOpacity ?? s.circle_stroke_opacity);
  if (s.rasterOpacity !== undefined || s.raster_opacity !== undefined) result.rasterOpacity = Number(s.rasterOpacity ?? s.raster_opacity);
  if (s.opacity !== undefined) result.opacity = Number(s.opacity);

  // Dimensions & numbers
  if (s.strokeWidth !== undefined || s.stroke_width !== undefined) result.strokeWidth = Number(s.strokeWidth ?? s.stroke_width);
  if (s.strokeBlur !== undefined || s.stroke_blur !== undefined) result.strokeBlur = Number(s.strokeBlur ?? s.stroke_blur);
  if (s.strokeOffset !== undefined || s.stroke_offset !== undefined) result.strokeOffset = Number(s.strokeOffset ?? s.stroke_offset);
  if (s.circleRadius !== undefined || s.circle_radius !== undefined) result.circleRadius = Number(s.circleRadius ?? s.circle_radius);
  if (s.circleBlur !== undefined || s.circle_blur !== undefined) result.circleBlur = Number(s.circleBlur ?? s.circle_blur);
  if (s.circleStrokeWidth !== undefined || s.circle_stroke_width !== undefined) result.circleStrokeWidth = Number(s.circleStrokeWidth ?? s.circle_stroke_width);

  // Raster params
  if (s.brightnessMin !== undefined || s.brightness_min !== undefined) result.brightnessMin = Number(s.brightnessMin ?? s.brightness_min);
  if (s.brightnessMax !== undefined || s.brightness_max !== undefined) result.brightnessMax = Number(s.brightnessMax ?? s.brightness_max);
  if (s.contrast !== undefined) result.contrast = Number(s.contrast);
  if (s.saturation !== undefined) result.saturation = Number(s.saturation);
  if (s.hueRotate !== undefined || s.hue_rotate !== undefined) result.hueRotate = Number(s.hueRotate ?? s.hue_rotate);
  if (s.fadeDuration !== undefined || s.fade_duration !== undefined) result.fadeDuration = Number(s.fadeDuration ?? s.fade_duration);
  if (s.resampling) result.resampling = s.resampling;

  // Enums & arrays
  if (s.lineCap || s.line_cap) result.lineCap = s.lineCap || s.line_cap;
  if (s.lineJoin || s.line_join) result.lineJoin = s.lineJoin || s.line_join;
  if (s.strokeDasharray || s.stroke_dasharray) {
    const arr = s.strokeDasharray || s.stroke_dasharray;
    if (Array.isArray(arr)) result.strokeDasharray = arr.map(Number).filter((n) => !isNaN(n));
  }
  if (s.fillAntialias !== undefined || s.fill_antialias !== undefined) {
    result.fillAntialias = Boolean(s.fillAntialias ?? s.fill_antialias);
  }
  if (s.visible_by_default !== undefined) result.visible_by_default = Boolean(s.visible_by_default);

  // Dual-compatibility interface
  result.style = { ...result };
  result.error = null;
  return result;
}

/**
 * Determines whether a layer has meaningful custom vector style properties configured.
 */
export function hasCustomVectorStyle(rawStyle) {
  if (!rawStyle || typeof rawStyle !== "object") return false;
  const s = normalizeDefaultStyle(rawStyle);
  return Boolean(
    s.fillColor ||
      s.strokeColor ||
      s.circleColor ||
      s.circleStrokeColor ||
      (s.opacity !== undefined && !isNaN(s.opacity)) ||
      (s.fillOpacity !== undefined && !isNaN(s.fillOpacity)) ||
      (s.strokeOpacity !== undefined && !isNaN(s.strokeOpacity)) ||
      (s.circleOpacity !== undefined && !isNaN(s.circleOpacity)) ||
      (s.circleStrokeOpacity !== undefined && !isNaN(s.circleStrokeOpacity)) ||
      (s.strokeWidth !== undefined && !isNaN(s.strokeWidth)) ||
      (s.strokeBlur !== undefined && !isNaN(s.strokeBlur)) ||
      (s.strokeOffset !== undefined && !isNaN(s.strokeOffset)) ||
      (s.circleRadius !== undefined && !isNaN(s.circleRadius)) ||
      (s.circleBlur !== undefined && !isNaN(s.circleBlur)) ||
      (s.circleStrokeWidth !== undefined && !isNaN(s.circleStrokeWidth)) ||
      (Array.isArray(s.strokeDasharray) && s.strokeDasharray.length > 0) ||
      s.lineCap ||
      s.lineJoin ||
      s.fillAntialias !== undefined
  );
}

/**
 * Builds Mapbox paint and layout configurations for polygon, line, point, or raster.
 */
export function toMapboxStyle(rawStyle, geometryKind = "polygon", layer = null) {
  const style = normalizeDefaultStyle(rawStyle);
  const kind = String(geometryKind).toLowerCase();

  let fillPaint = {};
  let outlinePaint = {};
  let linePaint = {};
  let lineLayout = {};
  let pointPaint = {};
  let rasterPaint = {};

  if (kind.includes("poly")) {
    const fillColor = style.fillColor || "#3388ff";
    const fillOpacity = style.fillOpacity ?? style.opacity ?? 0.35;
    const strokeColor = style.strokeColor || "#0055aa";
    const strokeOpacity = style.strokeOpacity ?? style.opacity ?? 0.9;
    const strokeWidth = style.strokeWidth ?? 1.5;
    const strokeBlur = style.strokeBlur ?? 0;

    fillPaint = {
      "fill-color": fillColor,
      "fill-opacity": fillOpacity,
      "fill-antialias": style.fillAntialias ?? true,
    };

    outlinePaint = {
      "line-color": strokeColor,
      "line-opacity": strokeOpacity,
      "line-width": strokeWidth,
      ...(strokeBlur > 0 ? { "line-blur": strokeBlur } : {}),
      ...(Array.isArray(style.strokeDasharray) && style.strokeDasharray.length >= 2
        ? { "line-dasharray": style.strokeDasharray }
        : {}),
    };

    lineLayout = {
      "line-cap": style.lineCap || "round",
      "line-join": style.lineJoin || "round",
    };
  } else if (kind.includes("line")) {
    const strokeColor = style.strokeColor || "#ff3300";
    const strokeOpacity = style.strokeOpacity ?? style.opacity ?? 0.95;
    const strokeWidth = style.strokeWidth ?? 2.5;
    const strokeBlur = style.strokeBlur ?? 0;
    const strokeOffset = style.strokeOffset ?? 0;

    linePaint = {
      "line-color": strokeColor,
      "line-opacity": strokeOpacity,
      "line-width": strokeWidth,
      ...(strokeBlur > 0 ? { "line-blur": strokeBlur } : {}),
      ...(strokeOffset !== 0 ? { "line-offset": strokeOffset } : {}),
      ...(Array.isArray(style.strokeDasharray) && style.strokeDasharray.length >= 2
        ? { "line-dasharray": style.strokeDasharray }
        : {}),
    };

    lineLayout = {
      "line-cap": style.lineCap || "round",
      "line-join": style.lineJoin || "round",
    };
  } else if (kind.includes("point")) {
    const circleColor = style.circleColor || GEOSERVER_POINT_PAINT?.point?.["circle-color"] || "#0f766e";
    const circleOpacity = style.circleOpacity ?? style.opacity ?? GEOSERVER_POINT_PAINT?.point?.["circle-opacity"] ?? 0.95;
    const circleRadius = style.circleRadius ?? GEOSERVER_POINT_PAINT?.point?.["circle-radius"] ?? 5.5;
    const circleBlur = style.circleBlur ?? 0;
    const circleStrokeColor = style.circleStrokeColor || GEOSERVER_POINT_PAINT?.point?.["circle-stroke-color"] || "#ffffff";
    const circleStrokeOpacity = style.circleStrokeOpacity ?? 1;
    const circleStrokeWidth = style.circleStrokeWidth ?? style.strokeWidth ?? GEOSERVER_POINT_PAINT?.point?.["circle-stroke-width"] ?? 1.5;

    pointPaint = {
      "circle-color": circleColor,
      "circle-opacity": circleOpacity,
      "circle-radius": circleRadius,
      "circle-stroke-color": circleStrokeColor,
      "circle-stroke-opacity": circleStrokeOpacity,
      "circle-stroke-width": circleStrokeWidth,
      ...(circleBlur > 0 ? { "circle-blur": circleBlur } : {}),
    };
  } else if (kind.includes("raster")) {
    const rasterOpacity = style.rasterOpacity ?? style.opacity ?? getDefaultRasterOpacity(layer || style);
    rasterPaint = {
      "raster-opacity": rasterOpacity,
      ...(style.brightnessMin !== undefined ? { "raster-brightness-min": style.brightnessMin } : {}),
      ...(style.brightnessMax !== undefined ? { "raster-brightness-max": style.brightnessMax } : {}),
      ...(style.contrast !== undefined ? { "raster-contrast": style.contrast } : {}),
      ...(style.saturation !== undefined ? { "raster-saturation": style.saturation } : {}),
      ...(style.hueRotate !== undefined ? { "raster-hue-rotate": style.hueRotate } : {}),
      ...(style.fadeDuration !== undefined ? { "raster-fade-duration": style.fadeDuration } : {}),
      ...(style.resampling ? { "raster-resampling": style.resampling } : {}),
    };
  }

  // Combined paint for backward compatibility with legacy MapHelper callers
  const combinedPaint = {
    ...fillPaint,
    ...outlinePaint,
    ...linePaint,
    ...pointPaint,
    ...rasterPaint,
  };

  return {
    fillPaint,
    outlinePaint,
    linePaint,
    lineLayout,
    pointPaint,
    rasterPaint,
    paint: combinedPaint,
    layout: lineLayout,
  };
}

