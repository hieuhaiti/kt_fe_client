import { STYLE_PROPERTY_DEFINITIONS } from "@/constant/mapLayerStyle";

const HEX_COLOR = /^#(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

const getDefinition = (key, geometryType) => STYLE_PROPERTY_DEFINITIONS.find(
  (definition) => definition.key === key && definition.geometryTypes.includes(geometryType),
);

const isValidValue = (definition, value) => {
  if (definition.type === "color") return typeof value === "string" && HEX_COLOR.test(value);
  if (definition.type === "boolean") return typeof value === "boolean";
  if (definition.type === "enum") return typeof value === "string" && definition.options?.includes(value);
  if (definition.type === "dasharray") return Array.isArray(value) && value.length <= 8 && value.every((item) => isFiniteNumber(item) && item >= 0);
  return isFiniteNumber(value) && (definition.min === undefined || value >= definition.min) && (definition.max === undefined || value <= definition.max);
};

export const normalizeDefaultStyle = (value, geometryType) => {
  if (value === null || value === undefined || value === "") return { style: {}, error: null };
  if (typeof value !== "object" || Array.isArray(value)) return { style: {}, error: "Kiểu vẽ phải là JSON object" };
  const style = {};
  for (const [key, rawValue] of Object.entries(value)) {
    const definition = getDefinition(key, geometryType);
    if (!definition) return { style: {}, error: `Thuộc tính kiểu vẽ không được hỗ trợ: ${key}` };
    if (!isValidValue(definition, rawValue)) return { style: {}, error: `Giá trị của ${key} không hợp lệ` };
    style[key] = rawValue;
  }
  return { style, error: null };
};

export const toMapboxStyle = (input, geometryType) => {
  const { style } = normalizeDefaultStyle(input, geometryType);
  const paint = {};
  const layout = {};
  if (geometryType === "polygon") {
    if (style.fillColor !== undefined) paint["fill-color"] = style.fillColor;
    if (style.fillOpacity !== undefined) paint["fill-opacity"] = style.fillOpacity;
    if (style.fillAntialias !== undefined) paint["fill-antialias"] = style.fillAntialias;
  }
  if (geometryType === "line" || geometryType === "polygon") {
    if (style.strokeColor !== undefined) paint["line-color"] = style.strokeColor;
    if (style.strokeOpacity !== undefined) paint["line-opacity"] = style.strokeOpacity;
    if (style.strokeWidth !== undefined) paint["line-width"] = style.strokeWidth;
    if (style.strokeBlur !== undefined) paint["line-blur"] = style.strokeBlur;
    if (style.strokeDasharray !== undefined) paint["line-dasharray"] = style.strokeDasharray;
    if (style.strokeOffset !== undefined) paint["line-offset"] = style.strokeOffset;
    if (style.lineCap !== undefined) layout["line-cap"] = style.lineCap;
    if (style.lineJoin !== undefined) layout["line-join"] = style.lineJoin;
  }
  if (geometryType === "point") {
    if (style.circleColor !== undefined) paint["circle-color"] = style.circleColor;
    if (style.circleOpacity !== undefined) paint["circle-opacity"] = style.circleOpacity;
    if (style.circleRadius !== undefined) paint["circle-radius"] = style.circleRadius;
    if (style.circleBlur !== undefined) paint["circle-blur"] = style.circleBlur;
    if (style.circleStrokeColor !== undefined) paint["circle-stroke-color"] = style.circleStrokeColor;
    if (style.circleStrokeOpacity !== undefined) paint["circle-stroke-opacity"] = style.circleStrokeOpacity;
    if (style.circleStrokeWidth !== undefined) paint["circle-stroke-width"] = style.circleStrokeWidth;
  }
  if (geometryType === "raster") {
    const opacity = style.opacity ?? style.rasterOpacity;
    if (opacity !== undefined) paint["raster-opacity"] = clamp(opacity, 0, 1);
    if (style.brightnessMin !== undefined) paint["raster-brightness-min"] = style.brightnessMin;
    if (style.brightnessMax !== undefined) paint["raster-brightness-max"] = style.brightnessMax;
    if (style.contrast !== undefined) paint["raster-contrast"] = style.contrast;
    if (style.saturation !== undefined) paint["raster-saturation"] = style.saturation;
    if (style.hueRotate !== undefined) paint["raster-hue-rotate"] = style.hueRotate;
    if (style.fadeDuration !== undefined) paint["raster-fade-duration"] = style.fadeDuration;
    if (style.resampling !== undefined) paint["raster-resampling"] = style.resampling;
  }
  return { paint, layout };
};

export const getDefaultRasterOpacity = (style) => {
  const value = style?.opacity ?? style?.rasterOpacity;
  return isFiniteNumber(value) ? clamp(value, 0, 1) : 0.72;
};
