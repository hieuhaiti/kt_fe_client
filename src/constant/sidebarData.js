import { Layers, Flame, Satellite, TreePine, History } from "lucide-react";
import { DataLayers } from "@/components/Map/Sidebar/elements/Datalyer";
import { MonitoringAndAlerting } from "@/components/Map/Sidebar/elements/MonitoringAndAlerting";
import { SingleMode } from "@/components/Map/Sidebar/elements/SatelliteControll";
import { ForestClassification } from "@/components/Map/Sidebar/elements/ForestClassification";
import { TimeSeries } from "@/components/Map/Sidebar/elements/TimeSeries";

export const trackMapping = [
  {
    id: "layers",
    icon: Layers,
    label: "Lớp dữ liệu bản đồ",
    description: "Quản lý và hiển thị các lớp dữ liệu bản đồ",
    color: "text-[#0B5EA7]",
    component: DataLayers,
    default: true,
  },
  {
    id: "monitoring",
    icon: Flame,
    label: "Cảnh báo cháy rừng",
    description: "Giám sát nguy cơ cháy rừng và điểm nhiệt vệ tinh",
    component: MonitoringAndAlerting,
    color: "text-[#D97706]",
  },
  {
    id: "forestClassification",
    icon: TreePine,
    label: "Phân loại rừng",
    description: "11 lớp hiện trạng rừng Kon Tum từ viễn thám",
    component: ForestClassification,
    color: "text-[#0F5132]",
  },
  {
    id: "timeSeries",
    icon: History,
    label: "Ảnh theo thời gian",
    description: "Chuỗi ảnh vệ tinh đa thời gian và giám sát biến động",
    component: TimeSeries,
    color: "text-[#2D9CDB]",
  },
  {
    id: "spatial-analysis",
    icon: Satellite,
    label: "Phân tích ảnh vệ tinh",
    description: "Phân tích phổ viễn thám và chỉ số thực vật",
    component: SingleMode,
    color: "text-[#4F5BD5]",
  },
];
