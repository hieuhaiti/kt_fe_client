import React, { useState } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { useSatelliteStore } from "@/stores/Map/Sidebar/useSatelliteStore";
import { LAYER_CONFIG } from "../shared/layerConfig";
import LayerControl from "../shared/LayerControl";
import { Button } from "@/components/ui/button";

/**
 * 2-column layer manager for CompareMode.
 * Left column = Period 1 (splitSide "left"), Right = Period 2 (splitSide "right").
 */
function LayerManager() {
  const [open, setOpen] = useState(true);
  const [layerOpacity, setLayerOpacity] = useState({});
  const [layerVisibility, setLayerVisibility] = useState({});

  const images = useSatelliteStore((s) => s.images);
  const updateLayerOpacity = useSatelliteStore((s) => s.updateLayerOpacity);
  const updateLayerVisibility = useSatelliteStore(
    (s) => s.updateLayerVisibility,
  );

  const comparisonImages = images?.comparison || [];
  const leftLayers = comparisonImages.filter((l) => l.splitSide === "left");
  const rightLayers = comparisonImages.filter((l) => l.splitSide === "right");

  if (comparisonImages.length === 0) return null;

  const makeOpacityHandler = (layerId) => (newOpacity) => {
    setLayerOpacity((prev) => ({ ...prev, [layerId]: newOpacity }));
    updateLayerOpacity(layerId, newOpacity);
  };

  const makeVisibilityHandler = (layerId) => (vis) => {
    setLayerVisibility((prev) => ({ ...prev, [layerId]: vis }));
    updateLayerVisibility(layerId, vis);
  };

  const renderLayerList = (layers, accentClass) =>
    layers.length === 0 ? (
      <p className="text-xs text-foreground/40 italic">Chưa có dữ liệu</p>
    ) : (
      layers.map((layer) => (
        <LayerControl
          key={layer.id}
          layer={layer}
          config={LAYER_CONFIG[layer.layerType]}
          opacity={layerOpacity[layer.id] ?? layer.layerOpacity ?? 1}
          onOpacityChange={makeOpacityHandler(layer.id)}
          visible={layerVisibility[layer.id] ?? layer.visible ?? true}
          onVisibilityChange={makeVisibilityHandler(layer.id)}
          accentClass={accentClass}
          compact
          opacityLabel="Độ mờ"
        />
      ))
    );

  return (
    <div className="bg-card overflow-hidden">
      <Button
        type="button"
        variant={open ? "soft-primary" : "outline"}
        onClick={() => setOpen(!open)}
        className="h-auto w-full justify-between rounded-none px-3 py-2"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Quản lý Layer
          </span>
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
            {comparisonImages.length}
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-foreground/60" />
        ) : (
          <ChevronDown size={16} className="text-foreground/60" />
        )}
      </Button>

      {open && (
        <div className="border-t border-border px-3 py-3">
          <div className="space-y-3">
            {/* Current period */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-blue-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Kỳ hiện tại
              </p>
              {renderLayerList(leftLayers, "text-blue-500 bg-blue-500/10")}
            </div>

            {/* Reference period */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-orange-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                Kỳ tham chiếu
              </p>
              {renderLayerList(rightLayers, "text-orange-500 bg-orange-500/10")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LayerManager;
