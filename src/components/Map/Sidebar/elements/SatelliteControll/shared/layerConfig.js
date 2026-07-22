import {
  getRgbComposite,
  getNdvi,
  getHeatmap,
  getClassified,
} from "@/features/map/api/satelliteApi";

/**
 * Shared layer configuration for both SingleMode and CompareMode.
 * CompareMode uses rgb, ndvi, heatmap only (no classified).
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
  classified: {
    label: "Ảnh Phân Loại",
    color: "bg-orange-500",
    service: getClassified,
    description: "Phân loại lớp phủ (11 lớp)",
    supportCompare: false,
  },
};

export const SINGLE_LAYER_ENTRIES = Object.entries(LAYER_CONFIG);

/** Entries available for compare mode */
export const COMPARE_LAYER_ENTRIES = Object.entries(LAYER_CONFIG).filter(
  ([, cfg]) => cfg.supportCompare,
);
