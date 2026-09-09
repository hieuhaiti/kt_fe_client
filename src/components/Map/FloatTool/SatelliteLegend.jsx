import React, { useState } from "react";
import { ChevronDown, ChevronUp, Layers, Map, X } from "lucide-react";
import { useSatelliteStore } from "@/stores/Map/Sidebar/useSatelliteStore";
import { useDataLayerStore } from "@/stores/Map/Sidebar/useDataLayerStore";
import { useMapStore } from "@/stores/Map/useMapStore";
import { LAYER_CONFIG } from "@/components/Map/Sidebar/elements/SatelliteControll/shared/layerConfig";
import { formatDateRange } from "@/components/Map/Sidebar/elements/SatelliteControll/shared/utils";
import { fmtKm2 } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Giới hạn độ dài chuỗi tên hiển thị để tránh quá dài, kết hợp CSS line-clamp-2
 */
const formatDisplayName = (name, maxLength = 70) => {
  if (!name || typeof name !== "string") return "";
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}…`;
};

/** Static fallback items when server provides no data */
const FALLBACK_LEGENDS = {
  ndvi: [
    { label: "< 0", color: "#8B0000" },
    { label: "0–0.1", color: "#FF0000" },
    { label: "0.1–0.2", color: "#FFA500" },
    { label: "0.2–0.3", color: "#FFFF00" },
    { label: "0.3–0.45", color: "#ADFF2F" },
    { label: "0.45–0.6", color: "#00FF00" },
    { label: "> 0.6", color: "#006400" },
  ],
  heatmap: [
    { label: "Rất mát (nước, rừng dày)", color: "#313695" },
    { label: "Mát (20–25°C)", color: "#74add1" },
    { label: "Trung bình (25–30°C)", color: "#e0f3f8" },
    { label: "Ấm (thực vật thưa)", color: "#fee090" },
    { label: "Nóng (đất trống, đô thị)", color: "#f46d43" },
    { label: "Rất nóng (mát đường, mái tôn)", color: "#a50026" },
  ],
  classified: [
    { label: "Đất khác", color: "#FFBEE8" },
    { label: "Cây công nghiệp", color: "#FFEBB0" },
    { label: "Đất nông nghiệp", color: "#F0E442" },
    { label: "Rừng hỗn giao lá rộng, lá kim", color: "#FEFF73" },
    { label: "Rừng lá rộng thường xanh", color: "#AAFF03" },
    { label: "Rừng lá kim", color: "#D0FF73" },
    { label: "Rừng lá rộng rụng lá", color: "#E7E600" },
    { label: "Rừng tre nứa", color: "#4DE600" },
    { label: "Rừng trồng", color: "#FFAA01" },
    { label: "Sông, suối, hồ", color: "#73B2FF" },
    { label: "Trảng cỏ, cây bụi", color: "#55FF00" },
  ],
  change: [
    { label: "Không đổi", color: "#808080" },
    { label: "ALERT: Giảm thảm thực vật", color: "#FF0000" },
    { label: "ALERT: Tăng thảm thực vật", color: "#00FF00" },
    { label: "ALERT: Mở đường / Xây dựng", color: "#00FFFF" },
    { label: "ALERT: Giảm thực vật + Mở đường", color: "#FF00FF" },
  ],
};

/**
 * Derive a unified items list from the satellite layer object.
 * Priority: areaStats.classes > layer.legend > FALLBACK_LEGENDS
 */
const getLegendItems = (layer) => {
  if (layer.areaStats?.classes?.length) {
    return layer.areaStats.classes.map((c) => ({
      color: c.color,
      label: c.label,
      areaKm2: c.areaKm2,
      pct: c.pct,
    }));
  }
  if (Array.isArray(layer.legend) && layer.legend.length > 0) {
    return layer.legend.map((item) => ({
      color: item.color,
      label: item.name ?? item.label ?? "",
      sublabel: item.range ?? null,
      areaKm2: item.areaHa != null ? item.areaHa / 100 : null,
    }));
  }
  return (FALLBACK_LEGENDS[layer.layerType] ?? []).map((item) => ({
    color: item.color,
    label: item.label,
  }));
};

/**
 * Individual legend group for one satellite layer.
 */
function SatelliteLegendGroup({ layer, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const config = LAYER_CONFIG[layer.layerType];
  const items = getLegendItems(layer);

  if (items.length === 0) return null;

  const periodLabel =
    layer.layerType === "change"
      ? ""
      : layer.splitSide === "left"
        ? "Kỳ hiện tại · "
        : layer.splitSide === "right"
          ? "Kỳ tham chiếu · "
          : "";

  const titleText = `${periodLabel}${config?.label || layer.layerType}`;

  return (
    <div className="space-y-1.5">
      {/* Group header */}
      <Button
        type="button"
        variant={open ? "soft-primary" : "outline"}
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-between items-start gap-2 px-2.5 py-1.5 group text-left whitespace-normal transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1 overflow-hidden">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${config?.color || "bg-gray-400"}`}
          />
          <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
            <span
              className="text-xs font-semibold text-foreground/90 leading-tight line-clamp-2 break-words"
              title={titleText}
            >
              {formatDisplayName(titleText, 70)}
            </span>
            <span className="text-[10px] text-foreground/45 leading-tight truncate mt-0.5 max-w-full">
              {formatDateRange(layer.date)}
            </span>
          </div>
        </div>
        <div className="shrink-0 mt-0.5 text-foreground/40 group-hover:text-foreground transition-colors">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </Button>

      {/* Items */}
      {open && (
        <div className="space-y-2 pl-1.5 pr-0.5">
          {items.map((item, i) => (
            <div key={i} className="space-y-0.5">
              {/* Row 1: color chip + name */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-xs shrink-0 border border-white/20"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex items-baseline gap-1 min-w-0 flex-1">
                  {item.sublabel && (
                    <span className="text-[10px] font-mono text-foreground/50 shrink-0">
                      {item.sublabel}
                    </span>
                  )}
                  <span
                    className="text-xs text-foreground/80 truncate min-w-0 flex-1"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                </div>
              </div>
              {/* Row 2: area + pct (only when available) */}
              {item.areaKm2 != null && (
                <div className="pl-5 flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {fmtKm2(item.areaKm2)}
                  </span>
                  {item.pct != null && (
                    <span className="text-[10px] text-muted-foreground/70">
                      · {item.pct}%
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual legend group for one OGC / Map layer.
 */
function MapLayerLegendGroup({ layer, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const legendConfig = layer.legend_config || layer.legend;
  const entries = Array.isArray(legendConfig?.entries) ? legendConfig.entries : [];

  if (entries.length === 0) return null;

  // Bỏ layer.code: không hiển thị mã kỹ thuật ra giao diện
  const rawLayerName = layer.name_vi || layer.name || "";
  const isCodeLike =
    !rawLayerName ||
    rawLayerName === layer.code ||
    /^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(rawLayerName);

  const layerName = isCodeLike
    ? (layer.category_name || layer.category || "Lớp chuyên đề")
    : rawLayerName;

  const rawCategory = layer.category_name || layer.category || "";
  const layerCategory =
    rawCategory && rawCategory !== layer.code && !/^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(rawCategory)
      ? rawCategory
      : "Lớp bản đồ";

  return (
    <div className="space-y-1.5">
      {/* Group header */}
      <Button
        type="button"
        variant={open ? "soft-primary" : "outline"}
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-between items-start gap-2 px-2.5 py-1.5 group text-left whitespace-normal transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1 overflow-hidden">
          <Layers size={12} className="text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
            <span
              className="text-xs font-semibold text-foreground/90 leading-tight line-clamp-2 break-words"
              title={rawLayerName || layerName}
            >
              {formatDisplayName(layerName, 70)}
            </span>
            <span className="text-[10px] text-foreground/45 leading-tight truncate mt-0.5 max-w-full">
              {layerCategory}
            </span>
          </div>
        </div>
        <div className="shrink-0 mt-0.5 text-foreground/40 group-hover:text-foreground transition-colors">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </Button>

      {/* Items */}
      {open && (
        <div className="space-y-1.5 pl-1.5 pr-0.5">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <div
                className="w-3 h-3 rounded-xs shrink-0 border border-white/20 shadow-xs"
                style={{ backgroundColor: entry.color }}
              />
              <span
                className="text-xs text-foreground/80 truncate min-w-0 flex-1"
                title={entry.label}
              >
                {entry.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual legend group for one Time-series raster layer group.
 */
function TimeSeriesLegendGroup({ item, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!item.entries || item.entries.length === 0) return null;

  const rawName = item.name || "";
  const isCodeLike = !rawName || rawName === item.groupCode;
  const displayName = isCodeLike ? "Chuỗi thời gian" : rawName;

  return (
    <div className="space-y-1.5">
      {/* Group header */}
      <Button
        type="button"
        variant={open ? "soft-primary" : "outline"}
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-between items-start gap-2 px-2.5 py-1.5 group text-left whitespace-normal transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1 overflow-hidden">
          <Layers size={12} className="text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
            <span
              className="text-xs font-semibold text-foreground/90 leading-tight line-clamp-2 break-words"
              title={rawName}
            >
              {formatDisplayName(displayName, 70)}
            </span>
            <span className="text-[10px] text-foreground/45 leading-tight truncate mt-0.5 max-w-full">
              {item.subtitle}
            </span>
          </div>
        </div>
        <div className="shrink-0 mt-0.5 text-foreground/40 group-hover:text-foreground transition-colors">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </Button>

      {/* Items */}
      {open && (
        <div className="space-y-1.5 pl-1.5 pr-0.5">
          {item.entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <div
                className="w-3 h-3 rounded-xs shrink-0 border border-white/20 shadow-xs"
                style={{ backgroundColor: entry.color }}
              />
              <span
                className="text-xs text-foreground/80 truncate min-w-0 flex-1"
                title={entry.label}
              >
                {entry.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SatelliteLegend() {
  const [collapsed, setCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const satelliteLayers = useSatelliteStore((s) => s.satelliteLayers);
  const isCompareMode = useSatelliteStore((s) => s.isCompareMode);
  const comparisonImages = useSatelliteStore((s) => s.images.comparison);

  const ogcLayers = useDataLayerStore((s) => s.ogcLayers);
  const timeSeriesLayersData = useMapStore((s) => s.timeSeriesLayersData);

  // In compare mode, use ALL comparison images so every loaded layer type
  // (ndvi, heatmap, rgb, …) appears in the legend, not just the active one.
  const sourceLayers = isCompareMode ? comparisonImages : satelliteLayers;

  const satLegendLayers = sourceLayers
    .filter((layer) => {
      if (layer.areaStats?.classes?.length) return true;
      if (Array.isArray(layer.legend) && layer.legend.length > 0) return true;
      return (FALLBACK_LEGENDS[layer.layerType]?.length ?? 0) > 0;
    })
    // Show the change detection layer only once (it's duplicated left/right for the split map)
    .filter((layer, idx, arr) => {
      if (layer.layerType !== "change") return true;
      return arr.findIndex((l) => l.layerType === "change") === idx;
    });

  const ogcLegendLayers = ogcLayers.filter(
    (l) =>
      l.enabled &&
      ((l.legend_config && Array.isArray(l.legend_config.entries) && l.legend_config.entries.length > 0) ||
        (l.legend && Array.isArray(l.legend.entries) && l.legend.entries.length > 0))
  );

  const timeSeriesLegendGroups = Object.entries(timeSeriesLayersData || {})
    .map(([groupCode, data]) => {
      if (!data) return null;
      const legendConfig = data.legend || data.group?.legend || data.step?.legend || null;
      const entries = Array.isArray(legendConfig?.entries)
        ? legendConfig.entries
        : (Array.isArray(legendConfig?.items) ? legendConfig.items : []);
      if (!entries.length) return null;

      // Không hiển thị groupCode kỹ thuật làm tên
      const groupName = data.group?.name_vi || data.group?.name_en || "Chuỗi thời gian";

      return {
        groupCode,
        name: groupName,
        subtitle: data.step?.label ? `Ảnh năm ${data.step.label}` : "Ảnh theo chuỗi thời gian",
        entries,
      };
    })
    .filter(Boolean);

  const totalCount = satLegendLayers.length + ogcLegendLayers.length + timeSeriesLegendGroups.length;

  if (totalCount === 0) return null;

  const titleText =
    (satLegendLayers.length > 0 && (ogcLegendLayers.length > 0 || timeSeriesLegendGroups.length > 0))
      ? "Chú giải bản đồ"
      : (timeSeriesLegendGroups.length > 0 && ogcLegendLayers.length === 0 && satLegendLayers.length === 0)
        ? "Chú giải chuỗi thời gian"
        : ogcLegendLayers.length > 0
          ? "Chú giải lớp bản đồ"
          : "Chú giải ảnh vệ tinh";

  // Khi người dùng bấm nút 'x' để ẩn legend: hiển thị nút phục hồi nhỏ gọn
  if (isHidden) {
    return (
      <Button
        type="button"
        variant="soft-primary"
        size="sm"
        onClick={() => setIsHidden(false)}
        className="h-8 gap-1.5 px-3 rounded-lg bg-card/95 backdrop-blur-md border border-border shadow-md text-xs font-medium hover:bg-accent cursor-pointer transition-all active:scale-95"
        title="Hiện chú giải bản đồ"
      >
        <Map size={13} className="text-primary shrink-0" />
        <span className="truncate max-w-[120px]">{titleText}</span>
        <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded-full text-[10px] font-semibold shrink-0">
          {totalCount}
        </span>
      </Button>
    );
  }

  return (
    <div className="w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-1.5 px-3 py-2 bg-muted/30 border-b border-border/40 select-none">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer hover:opacity-80 transition-opacity"
          aria-expanded={!collapsed}
          title={collapsed ? "Mở rộng chú giải" : "Thu gọn chú giải"}
        >
          <Map size={13} className="text-primary shrink-0" />
          <span
            className="text-xs font-semibold text-foreground line-clamp-1 truncate"
            title={titleText}
          >
            {titleText}
          </span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold shrink-0">
            {totalCount}
          </span>
        </button>

        {/* Action buttons: Thu gọn/mở rộng + Nút X ẩn legend */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="p-1 rounded-md text-foreground/50 hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            title={collapsed ? "Mở rộng" : "Thu gọn"}
            aria-label={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setIsHidden(true)}
            className="p-1 rounded-md text-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Ẩn chú giải"
            aria-label="Ẩn chú giải"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-3 max-h-[min(380px,60vh)] overflow-y-auto border-t border-border/40">
          <div className="pt-2 space-y-2.5">
            {/* Time-series Raster Layers */}
            {timeSeriesLegendGroups.map((group) => (
              <TimeSeriesLegendGroup
                key={`ts-${group.groupCode}`}
                item={group}
                defaultOpen={totalCount <= 2}
              />
            ))}

            {/* OGC / Map Layers */}
            {ogcLegendLayers.map((layer) => (
              <MapLayerLegendGroup
                key={layer.id || layer.code}
                layer={layer}
                defaultOpen={totalCount <= 2}
              />
            ))}

            {/* Satellite Layers */}
            {satLegendLayers.map((layer) => (
              <SatelliteLegendGroup
                key={layer.id}
                layer={layer}
                defaultOpen={totalCount <= 2}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const MapLegend = SatelliteLegend;
export default SatelliteLegend;
