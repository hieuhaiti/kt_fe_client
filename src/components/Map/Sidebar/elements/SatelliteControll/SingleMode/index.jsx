import React from "react";
import { AlertCircle, Satellite } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSatelliteStore } from "@/stores/Map/Sidebar/useSatelliteStore";
import ConfigPanel from "./ConfigPanel";
import LayerManager from "./LayerManager";

/**
 * GEEAnalysis – Single-mode satellite imagery analysis.
 * Orchestrates ConfigPanel and LayerManager sub-components.
 */
export function GEEAnalysis() {
  const error = useSatelliteStore((s) => s.error);
  const analysisData = useSatelliteStore((s) => s.analysisData);
  const satelliteLayers = useSatelliteStore((s) => s.satelliteLayers);

  const getTotalImages = () => {
    if (!analysisData) return 0;
    return Object.values(analysisData).reduce(
      (acc, r) => acc + (r?.stats?.imageCount || 0),
      0,
    );
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {error && (
        <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="flex flex-col space-y-3 p-0">
          <ConfigPanel />
          <LayerManager />

          {/* Summary Info */}
          {analysisData && Object.keys(analysisData).length > 0 && (
            <div className="mx-0 p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-1">
              <div className="flex items-center gap-2">
                <Satellite size={14} className="text-primary" />
                <span className="text-xs font-medium text-primary">
                  Thống kê ảnh
                </span>
              </div>
              <p className="text-xs text-foreground/70 ml-6">
                Tổng:{" "}
                <span className="font-semibold text-foreground">
                  {getTotalImages()} ảnh
                </span>
              </p>
              <p className="text-xs text-foreground/70 ml-6">
                Layer:{" "}
                <span className="font-semibold text-foreground">
                  {satelliteLayers.length} lớp
                </span>
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default GEEAnalysis;
