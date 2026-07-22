import React, { useState } from "react";
import { ChevronDown, ChevronUp, Map } from "lucide-react";
import { useSatelliteStore } from "@/stores/Map/Sidebar/useSatelliteStore";
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
 * Derive a unified items list from the layer object.
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
    // BUG-FIX (2026-07-19): server giờ trả areaHa trong mỗi legend item (11-class
    // classified). Convert ha → km² để dùng cùng renderer với `areaStats.classes`
    // (bước 2 phía dưới hiển thị fmtKm2). Không có → giữ null → chỉ hiện tên.
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
function LegendGroup({ layer, defaultOpen = true }) {
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

export function SatelliteLegend() {
  const [collapsed, setCollapsed] = useState(false);
  const satelliteLayers = useSatelliteStore((s) => s.satelliteLayers);
  const isCompareMode = useSatelliteStore((s) => s.isCompareMode);
  const comparisonImages = useSatelliteStore((s) => s.images.comparison);

  // In compare mode, use ALL comparison images so every loaded layer type
  // (ndvi, heatmap, rgb, …) appears in the legend, not just the active one.
  const sourceLayers = isCompareMode ? comparisonImages : satelliteLayers;

  const legendLayers = sourceLayers
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

  if (legendLayers.length === 0) return null;

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
            Chú giải ảnh vệ tinh
          </span>
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
            {legendLayers.length}
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
            {legendLayers.map((layer) => (
              <LegendGroup
                key={layer.id}
                layer={layer}
                defaultOpen={legendLayers.length <= 2}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SatelliteLegend;
