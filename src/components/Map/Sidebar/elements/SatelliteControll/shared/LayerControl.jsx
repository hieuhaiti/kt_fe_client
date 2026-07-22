import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Cloud,
  Download,
  TriangleAlert,
  Image,
  FileJson,
  ChevronDown,
  ChevronUp,
  BarChart2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import LoadingInline from "@/components/common/LoadingInline";
import { formatDateRange } from "./utils";

/** Slugify tiếng Việt → ASCII an toàn cho filename */
const slugify = (s) =>
  (s || "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^0-9a-zA-Z]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** "2025-02-27" → "20250227" */
const toCompactDate = (d) => (d || "").replace(/\D/g, "").slice(0, 8);

/** "2025-02-27 - 2026-02-27" → { from, to } */
const parseDateRange = (s) => {
  const raw = (s || "").trim();
  if (!raw) return { from: "", to: "" };
  // Tách theo dấu phân cách khoảng " - ", " – ", " — " (có khoảng trắng 2 bên)
  const parts = raw.split(/\s+[-–—]\s+/);
  return { from: parts[0] || "", to: parts[1] || "" };
};

/** Build filename: Anh_Nhiet_20250227-20260227.tif */
const buildDownloadFilename = (
  layer,
  config,
  extension = "tif",
  suffix = "",
) => {
  const label = slugify(config?.label || layer.layerType) || "satellite";
  const { from, to } = parseDateRange(layer.date);
  const f = toCompactDate(from);
  const t = toCompactDate(to);
  const datePart = f && t ? `${f}-${t}` : f;
  const safeSuffix = suffix ? `_${slugify(suffix)}` : "";
  return `${label}${datePart ? `_${datePart}` : ""}${safeSuffix}.${extension}`;
};
/**
 * Shared satellite layer control card.
 *
 * @param {object}  layer
 * @param {number}  index              - used as fallback label in non-compact mode
 * @param {object}  config             - LAYER_CONFIG entry
 * @param {number}  opacity
 * @param {function} onOpacityChange
 * @param {boolean} visible
 * @param {function} onVisibilityChange
 * @param {string}  accentClass        - Tailwind classes for the opacity badge (default: primary)
 * @param {boolean} compact            - Smaller dots/icons + cloud cover in date row (Compare layout)
 * @param {string}  opacityLabel       - Label above the slider
 */
/** Render per-layer-type stat rows from the stats object */
function StatsRows({ layerType, stats }) {
  if (!stats) return null;
  const rows = [];

  if (stats.imageCount != null) {
    rows.push({ label: "Số ảnh", value: `${stats.imageCount} ảnh` });
  }
  if (layerType === "ndvi") {
    if (stats.vegetationHa != null)
      rows.push({ label: "Diện tích thực vật", value: `${stats.vegetationHa.toLocaleString("vi-VN")} ha` });
    if (stats.ndviThreshUsed != null)
      rows.push({ label: "Ngưỡng NDVI", value: `≥ ${stats.ndviThreshUsed}` });
  }
  if (layerType === "heatmap") {
    if (stats.lstMeanC != null)
      rows.push({ label: "LST trung bình", value: `${stats.lstMeanC.toFixed(2)} °C` });
    if (stats.lstMinC != null)
      rows.push({ label: "LST min", value: `${stats.lstMinC.toFixed(2)} °C` });
    if (stats.lstMaxC != null)
      rows.push({ label: "LST max", value: `${stats.lstMaxC.toFixed(2)} °C` });
  }
  if (layerType === "classified") {
    if (stats.year != null)
      rows.push({ label: "Năm phân tích", value: String(stats.year) });
    if (stats.oobAccuracyPct != null)
      rows.push({ label: "Độ chính xác OOB", value: `${stats.oobAccuracyPct.toFixed(1)} %` });
    if (stats.testAccuracyPct != null)
      rows.push({ label: "Test accuracy", value: `${stats.testAccuracyPct.toFixed(1)} %` });
  }

  if (rows.length === 0) return null;

  return (
    <div className="space-y-1">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-foreground/50">{label}</span>
          <span className="text-[10px] font-medium text-foreground/80">{value}</span>
        </div>
      ))}
      {layerType === "classified" && Array.isArray(stats.areaByClass) && stats.areaByClass.some(c => c.areaHa != null) && (
        <div className="pt-1 space-y-0.5">
          {stats.areaByClass.map((c) => (
            <div key={c.classId} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: c.color }} />
              <span className="text-[10px] text-foreground/60 flex-1 truncate">{c.name}</span>
              <span className="text-[10px] font-medium text-foreground/80 shrink-0">
                {c.areaHa != null ? `${c.areaHa.toLocaleString("vi-VN")} ha` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LayerControl({
  layer,
  index,
  config,
  opacity,
  onOpacityChange,
  visible,
  onVisibilityChange,
  accentClass = "text-primary bg-primary/10",
  compact = false,
}) {
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState("raster");
  const [statsOpen, setStatsOpen] = useState(false);
  const rasterUrl = layer?.downloadUrls?.raster || layer?.downloadUrl || null;
  const hasRasterDownload = !!rasterUrl;
  const hasVectorDownload = false;
  const iconSize = compact ? 13 : 14;
  const dotClass = compact ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <Card className="p-2 bg-surface-muted/50 border-border/50 hover:border-border transition-colors">
      <div className="space-y-2">
        {/* Layer Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`${dotClass} rounded-full shrink-0 ${config?.color || "bg-gray-400"}`}
            />
            {compact ? (
              /* Compare: just name, cloud cover moves to date row */
              <p className="text-xs font-medium text-foreground truncate">
                {config?.label || layer.layerType}
              </p>
            ) : (
              /* Single: name + cloud cover badge inline, date below */
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-foreground truncate">
                    {config?.label || `Layer ${index + 1}`}
                  </p>
                  {layer.cloudCover != null && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-500 shrink-0">
                      <Cloud size={10} />
                      {layer.cloudCover}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground/50 truncate">
                  {formatDateRange(layer.date)}
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {/* Visibility */}
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={visible ? "soft-primary" : "outline"}
                  size="icon-xs"
                  onClick={() => onVisibilityChange(!visible)}
                  className="rounded"
                  aria-label={visible ? "Ẩn lớp ảnh" : "Hiển thị lớp ảnh"}
                >
                  {visible ? (
                    <Eye size={iconSize} className="text-primary" />
                  ) : (
                    <EyeOff size={iconSize} className="text-foreground/40" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {visible ? "Ẩn" : "Hiển thị"}
              </TooltipContent>
            </Tooltip>

            {/* Download button (raster) */}
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant={hasRasterDownload ? "soft-primary" : "outline"}
                  size="icon-xs"
                  onClick={() => {
                    if (!hasRasterDownload) return;
                    setDownloadType("raster");
                    setDownloadDialogOpen(true);
                  }}
                  className={
                    hasRasterDownload
                      ? "text-primary"
                      : "text-foreground/25 cursor-not-allowed"
                  }
                  disabled={!hasRasterDownload}
                >
                  <Image size={iconSize} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {hasRasterDownload
                  ? "Tải xuống ảnh raster"
                  : "Không có liên kết tải về"}
              </TooltipContent>
            </Tooltip>

            {/* Download button (vector) */}
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant={hasVectorDownload ? "soft-info" : "outline"}
                  size="icon-xs"
                  onClick={() => {
                    if (!hasVectorDownload) return;
                    setDownloadType("vector");
                    setDownloadDialogOpen(true);
                  }}
                  className={
                    hasVectorDownload
                      ? "text-primary"
                      : "text-foreground/25 cursor-not-allowed"
                  }
                  disabled={!hasVectorDownload}
                >
                  <FileJson size={iconSize} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {hasVectorDownload
                  ? "Tải xuống file GEOJSON (Vector)"
                  : "Không có liên kết tải về"}
              </TooltipContent>
            </Tooltip>

            {/* Download confirmation dialog */}
            <Dialog
              open={downloadDialogOpen}
              onOpenChange={setDownloadDialogOpen}
            >
              <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TriangleAlert
                      size={18}
                      className="text-warning shrink-0"
                    />
                    Xác nhận tải xuống{" "}
                    {downloadType === "vector" ? "vector" : "raster"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-foreground/70">
                    {downloadType === "vector"
                      ? "Lưu ý: File vector sẽ được cắt theo vùng nghiên cứu — buffer 20km quanh biên giới."
                      : "Lưu ý: Ảnh sau khi tải sẽ được cắt theo vùng nghiên cứu — buffer 20km quanh biên giới."}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDownloadDialogOpen(false)}
                  >
                    Đóng
                  </Button>
                  <Button
                    variant={
                      downloadType === "vector"
                        ? "gradient-info"
                        : "gradient-primary"
                    }
                    disabled={isDownloading}
                    onClick={async () => {
                      try {
                        setIsDownloading(true);
                        if (downloadType === "vector") {
                          throw new Error("Vector download is unavailable");
                        }

                        const rasterFilename = buildDownloadFilename(
                          layer,
                          config,
                          "tif",
                        );
                        const res = await fetch(rasterUrl);
                        const blob = await res.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = rasterFilename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                      } catch (err) {
                        console.error("Download failed:", err);
                        if (downloadType === "raster" && rasterUrl) {
                          window.open(rasterUrl, "_blank");
                        }
                      } finally {
                        setIsDownloading(false);
                        setDownloadDialogOpen(false);
                      }
                    }}
                  >
                    {isDownloading ? (
                      <LoadingInline size="small" />
                    ) : (
                      <Download size={iconSize} />
                    )}
                    {isDownloading ? "Đang tải..." : "Tải xuống"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Date + Cloud cover row — compact (Compare) layout only */}
        {compact && (
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs text-foreground/50 truncate leading-tight">
              {formatDateRange(layer.date)}
            </p>
            {layer.cloudCover != null && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-500 shrink-0">
                <Cloud size={10} />
                {layer.cloudCover}%
              </span>
            )}
          </div>
        )}

        {/* Opacity */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-foreground/60">Độ trong suốt</label>
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${accentClass}`}
            >
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[opacity]}
            onValueChange={(val) => onOpacityChange(val[0])}
            className="w-full"
          />
        </div>

        {/* Stats panel */}
        {layer.stats && (
          <div className="border-t border-border/40 pt-1.5">
            <button
              type="button"
              onClick={() => setStatsOpen((o) => !o)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground/60 uppercase tracking-wide">
                <BarChart2 size={10} />
                Chỉ số
              </span>
              {statsOpen ? (
                <ChevronUp size={10} className="text-foreground/40" />
              ) : (
                <ChevronDown size={10} className="text-foreground/40" />
              )}
            </button>
            {statsOpen && (
              <div className="mt-1.5">
                <StatsRows layerType={layer.layerType} stats={layer.stats} />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default LayerControl;
