import { Layers, Flame, Satellite, TreePine } from "lucide-react";
import { DataLayers } from "@/components/Map/Sidebar/elements/Datalyer";
import { MonitoringAndAlerting } from "@/components/Map/Sidebar/elements/MonitoringAndAlerting";
import { SingleMode } from "@/components/Map/Sidebar/elements/SatelliteControll";
import { ForestClassification } from "@/components/Map/Sidebar/elements/ForestClassification";

export const trackMapping = [
  {
    id: "layers",
    icon: Layers,
    label: "Lớp dữ liệu bản đồ",
    color: "text-blue-500",
    component: DataLayers,
    default: true,
  },
  {
    id: "monitoring",
    icon: Flame,
    label: "Cảnh báo cháy rừng",
    component: MonitoringAndAlerting,
    color: "text-orange-500",
  },

  {
    id: "forestClassification",
    icon: TreePine,
    label: "Phân loại rừng",
    description:
      "Phân loại 11 lớp phủ rừng theo tháng từ dữ liệu vệ tinh Landsat/Sentinel-2",
    component: ForestClassification,
    color: "text-green-600",
  },
  {
    id: "spatial-analysis",
    icon: Satellite,
    label: "Phân tích ảnh vệ tinh",
    component: SingleMode,
    color: "text-indigo-500",
  },
];
