/**
 * Export map canvas to PNG with high resolution
 */
const exportMapAsPNG = async (mapRef, filename = "map.png") => {
  if (!mapRef || !mapRef.single || !mapRef.single.getCanvas()) {
    toast.error("Chưa thể lưu ảnh bản đồ.");
    return;
  }

  try {
    const canvas = mapRef.single.getCanvas();

    // Get current canvas data as PNG
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Không thể lưu ảnh bản đồ. Hãy thử lại.");
        return;
      }

      // Create blob URL and download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `map-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  } catch (error) {
    toast.error("Không thể lưu ảnh bản đồ. Hãy thử lại.");
    throw error;
  }
};

import { Download, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { toast } from "react-toastify";
import { useMapStyleStore } from "@/stores/Map/Sidebar/useMapStyleStore";

export function MapToolbar({ mapRef }) {
  const [isExporting, setIsExporting] = useState(false);
  const { clickedPointMode, toggleClickedPointMode } = useMapStyleStore();

  const handleExportPNG = async () => {
    if (!mapRef?.current) return;

    try {
      setIsExporting(true);
      const timestamp = new Date().toISOString().slice(0, 10);
      await exportMapAsPNG(mapRef.current, `map-${timestamp}.png`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="absolute top-14 sm:top-2 left-2 z-10 flex items-center gap-2 pointer-events-auto">
      {/* Export Actions */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-card/90 backdrop-blur-sm border border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="soft-primary"
              size="icon-sm"
              onClick={handleExportPNG}
              disabled={isExporting}
              aria-label="Lưu ảnh bản đồ (PNG)"
            >
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Lưu ảnh bản đồ (PNG)</TooltipContent>
        </Tooltip>

        {/* Toggle clickedPoint mode - click on map to get AQI info */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={clickedPointMode ? "soft-primary" : "outline"}
              size="icon-sm"
              onClick={toggleClickedPointMode}
              aria-label={
                clickedPointMode
                  ? "Tắt xem chất lượng không khí"
                  : "Xem chất lượng không khí"
              }
            >
              <MapPinned className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {clickedPointMode
              ? "Tắt xem chất lượng không khí"
              : "Bật rồi chọn một điểm để xem chất lượng không khí"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
