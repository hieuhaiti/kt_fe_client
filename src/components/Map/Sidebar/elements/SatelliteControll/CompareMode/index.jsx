import React from "react";
import { AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSatelliteStore } from "@/stores/Map/Sidebar/useSatelliteStore";
import ConfigPanel from "./ConfigPanel";
import LayerManager from "./LayerManager";

/**
 * CompareSatellite – Compare-mode satellite imagery analysis.
 * Orchestrates ConfigPanel (with isCompareMode lifecycle) and LayerManager.
 */
export function CompareSatellite() {
  const error = useSatelliteStore((s) => s.error);

  return (
    <div className="h-full flex flex-col bg-surface">
      {error && (
        <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="flex flex-col space-y-3">
          <ConfigPanel />
          <LayerManager />
        </div>
      </ScrollArea>
    </div>
  );
}

export default CompareSatellite;
