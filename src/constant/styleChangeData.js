import { Layers, Map, Navigation, Satellite } from "lucide-react";

export const mapStyles = [
  {
    name: "Ngoài trời",
    style: import.meta.env.VITE_MAPBOX_STYLE_Outdoor,
    description: "Địa hình và khu vực rừng tỉnh Kon Tum",
    icon: Map,
  },
  {
    name: "Đường phố",
    style: import.meta.env.VITE_MAPBOX_STYLE_Street,
    description: "Đường giao thông và địa danh tỉnh Kon Tum",
    icon: Navigation,
  },
  {
    name: "Vệ tinh",
    style: import.meta.env.VITE_MAPBOX_STYLE_Satellite,
    description: "Ảnh vệ tinh phục vụ giám sát hiện trạng",
    icon: Satellite,
  },
  {
    name: "Hỗn hợp",
    style: import.meta.env.VITE_MAPBOX_STYLE_Satellite_Street,
    description: "Kết hợp ảnh vệ tinh, đường và địa danh",
    icon: Layers,
  },
];
