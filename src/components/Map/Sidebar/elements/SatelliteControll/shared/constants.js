/** Labels dùng chung trong các ConfigPanel vệ tinh */
export const LABELS = {
  // Sections
  timeRange: "Thời gian",
  timeRangeCompare: "Thời gian so sánh",
  layerTypes: "Loại ảnh",
  settings: "Cài đặt",

  // Date inputs
  from: "Từ",
  to: "Đến",

  // Compare periods
  period1: "Kỳ hiện tại",
  period2: "Kỳ tham chiếu",

  // Settings fields
  collection: "Nguồn dữ liệu",
  cloudCover: "Mức mây tối đa",

  // Actions
  loadImage: "Tải ảnh",
  loading: "Đang tải...",
  reset: "Đặt lại",

  // Config panel titles
  configTitle: "Cấu hình",
  configCompareTitle: "Cấu hình so sánh",

  // Tooltip
  loadingTooltip: "Đang tải...",

  // Errors
  errorNoRoi: "Không thể tải dữ liệu ROI. Vui lòng tải lại trang.",
  errorNoLayer: "Vui lòng chọn ít nhất 1 loại ảnh",
  errorInvalidDate: "Ngày không hợp lệ. Vui lòng chọn lại.",
  errorDateOrder: "Ngày bắt đầu phải trước ngày kết thúc",
  errorGeneric: "Có lỗi xảy ra. Vui lòng thử lại.",
};

/** Danh sách collection vệ tinh */
export const COLLECTION_OPTIONS = [
  { value: "S2", label: "Sentinel-2" },
  { value: "L8", label: "Landsat 8" },
  { value: "L9", label: "Landsat 9" },
];

/** Giới hạn cloud cover slider */
export const CLOUD_COVER_MIN = 0;
export const CLOUD_COVER_MAX = 100;
