/**
 * Zustand Store quản lý trạng thái Buffer Analysis
 * Lưu trữ:
 * - borderFeature: Đường biên giới GeoJSON
 * - bufferGeoJSON: Polygon vùng đệm đã tính toán
 * - bufferConfig: Cấu hình buffer (distance, units, tolerance)
 */

import { create } from "zustand";

export const useBufferAnalysisStore = create((set) => ({
  // ─── Data ─────────────────────────────────────────────────────────
  borderFeature: null, // LineString/MultiLineString GeoJSON
  bufferGeoJSON: null, // Polygon GeoJSON
  settlements: null, // FeatureCollection of Points

  // ─── UI State ─────────────────────────────────────────────────────
  isLoading: false, // Đang tính toán

  // ─── Setters ─────────────────────────────────────────────────────

  /**
   * Đặt borderFeature (đường biên giới)
   * @param {Object|null} feature - GeoJSON LineString/MultiLineString
   */
  setBorderFeature: (feature) => {
    set({ borderFeature: feature });
  },

  /**
   * Đặt buffer GeoJSON khi hoàn thành tính toán
   * @param {Object|null} geoJSON - Polygon GeoJSON
   */
  setBufferGeoJSON: (geoJSON) => {
    set({ bufferGeoJSON: geoJSON });
  },

  /**
   * Đặt settlements (khu dân cư)
   * @param {Object|null} collection - FeatureCollection of Points
   */
  setSettlements: (collection) => {
    set({ settlements: collection });
  },

  /**
   * Set loading state
   */
  setIsLoading: (loading) => {
    set({ isLoading: loading });
  },

  /**
   * Reset toàn bộ store
   */
  reset: () => {
    set({
      borderFeature: null,
      bufferGeoJSON: null,
      settlements: null,
      isLoading: false,
    });
  },

  /**
   * Clear buffers (giữ border + config)
   */
  clearBuffers: () => {
    set({ bufferGeoJSON: null, settlements: null });
  },
}));
