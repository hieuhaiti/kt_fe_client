import {
  getRgbComposite,
  getNdvi,
  getHeatmap,
} from "@/features/map/api/satelliteApi";

/**
 * Shared layer configuration for both SingleMode and CompareMode.
 */
export const LAYER_CONFIG = {
  rgb: {
    label: "Ảnh Màu",
    color: "bg-blue-500",
    service: getRgbComposite,
    description: "Ảnh tổng hợp màu gốc (RGB)",
    supportCompare: true,
  },
  ndvi: {
    label: "Ảnh NDVI",
    color: "bg-green-500",
    service: getNdvi,
    description: "Chỉ số thực vật NDVI",
    supportCompare: true,
  },
  heatmap: {
    label: "Ảnh Nhiệt",
    color: "bg-purple-500",
    service: getHeatmap,
    description: "Nhiệt độ bề mặt (LST)",
    supportCompare: true,
  },
};

export const SINGLE_LAYER_ENTRIES = Object.entries(LAYER_CONFIG);

/** Entries available for compare mode */
export const COMPARE_LAYER_ENTRIES = Object.entries(LAYER_CONFIG).filter(
  ([, cfg]) => cfg.supportCompare,
);
