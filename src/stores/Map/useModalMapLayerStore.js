import { create } from "zustand";

/**
 * Store quản lý modal hiển thị chi tiết map layer (chỉ dành cho Point)
 *
 * Dữ liệu mapLayer bao gồm: id, category, name, geometry_type,
 * geometry_data, properties, is_active
 */
export const useModalMapLayerStore = create((set) => ({
  isOpen: false,
  mapLayerData: null,

  /**
   * Mở modal với dữ liệu map layer
   * @param {Object} data - Dữ liệu map layer từ API
   */
  openModal: (data) => {
    set({ isOpen: true, mapLayerData: data });
  },

  /**
   * Đóng modal
   */
  closeModal: () => {
    set({ isOpen: false, mapLayerData: null });
  },
}));
