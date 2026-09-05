import React, { useState } from "react";
import { ChevronDown, ChevronUp, Layers, Map } from "lucide-react";
import { useSatelliteStore } from "@/stores/Map/Sidebar/useSatelliteStore";
import { useDataLayerStore } from "@/stores/Map/Sidebar/useDataLayerStore";
import { useMapStore } from "@/stores/Map/useMapStore";
import { LAYER_CONFIG } from "@/components/Map/Sidebar/elements/SatelliteControll/shared/layerConfig";
import { formatDateRange } from "@/components/Map/Sidebar/elements/SatelliteControll/shared/utils";
import { fmtKm2 } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="space-y-1.5">
      {/* Group header */}
      <Button
        type="button"
        variant={open ? "soft-primary" : "outline"}
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-between gap-2 px-2 py-1 group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${config?.color || "bg-gray-400"}`}
          />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-semibold text-foreground/90 truncate leading-tight">
              {periodLabel}
              {config?.label || layer.layerType}
            </span>
            <span className="text-[10px] text-foreground/40 truncate leading-tight">
              {formatDateRange(layer.date)}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUp size={12} className="text-foreground/40 shrink-0" />
        ) : (
          <ChevronDown size={12} className="text-foreground/40 shrink-0" />
        )}
      </Button>

      {/* Items */}
      {open && (
        <div className="space-y-2 pl-1">
          {items.map((item, i) => (
            <div key={i} className="space-y-0.5">
              {/* Row 1: color chip + name */}
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm shrink-0 border border-white/20"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex items-baseline gap-1 min-w-0">
                  {item.sublabel && (
                    <span className="text-[10px] font-mono text-foreground/50 shrink-0">
                      {item.sublabel}
                    </span>
                  )}
                  <span className="text-xs text-foreground/80 truncate">
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

  const layerName = layer.name || layer.name_vi || layer.code;
  const layerCategory = layer.category_name || layer.category || "Lớp bản đồ";

  return (
    <div className="space-y-1.5">
      {/* Group header */}
      <Button
        type="button"
        variant={open ? "soft-primary" : "outline"}
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-between gap-2 px-2 py-1 group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Layers size={11} className="text-primary shrink-0" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-semibold text-foreground/90 truncate leading-tight">
              {layerName}
            </span>
            <span className="text-[10px] text-foreground/40 truncate leading-tight">
              {layerCategory}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUp size={12} className="text-foreground/40 shrink-0" />
        ) : (
          <ChevronDown size={12} className="text-foreground/40 shrink-0" />
        )}
      </Button>

      {/* Items */}
      {open && (
        <div className="space-y-1.5 pl-1">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0 border border-white/20 shadow-xs"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-foreground/80 truncate">
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

  return (
    <div className="space-y-1.5">
      {/* Group header */}
      <Button
        type="button"
        variant={open ? "soft-primary" : "outline"}
        onClick={() => setOpen((v) => !v)}
        className="h-auto w-full justify-between gap-2 px-2 py-1 group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Layers size={11} className="text-primary shrink-0" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-semibold text-foreground/90 truncate leading-tight">
              {item.name}
            </span>
            <span className="text-[10px] text-foreground/40 truncate leading-tight">
              {item.subtitle}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUp size={12} className="text-foreground/40 shrink-0" />
        ) : (
          <ChevronDown size={12} className="text-foreground/40 shrink-0" />
        )}
      </Button>

      {/* Items */}
      {open && (
        <div className="space-y-1.5 pl-1">
          {item.entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm shrink-0 border border-white/20 shadow-xs"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-foreground/80 truncate">
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

      return {
        groupCode,
        name: data.group?.name_vi || data.group?.name_en || groupCode,
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

  return (
    <div className="min-w-52 max-w-72 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
      {/* Header */}
      <Button
        type="button"
        variant={collapsed ? "outline" : "soft-primary"}
        onClick={() => setCollapsed((v) => !v)}
        className="h-auto w-full justify-between rounded-t-lg px-3 py-2"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <Map size={13} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {titleText}
          </span>
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
            {totalCount}
          </span>
        </div>
        {collapsed ? (
          <ChevronUp size={13} className="text-foreground/50 shrink-0" />
        ) : (
          <ChevronDown size={13} className="text-foreground/50 shrink-0" />
        )}
      </Button>

      {/* Body */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-3 max-h-96 overflow-y-auto border-t border-border/60">
          <div className="pt-2 space-y-3">
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
