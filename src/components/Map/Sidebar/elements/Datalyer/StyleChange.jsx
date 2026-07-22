import { useEffect } from "react";
import { Palette } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingInline from "@/components/common/LoadingInline";
import { useDebounceStore } from "@/stores/common/useDebounceStore";
import { useMapStyleStore } from "@/stores/Map/Sidebar/useMapStyleStore";
import { mapStyles } from "@/constant/styleChangeData";

export function StyleChange() {
  // Style state
  const selectedStyle = useMapStyleStore((s) => s.mapStyle);
  const setMapStyle = useMapStyleStore((s) => s.setMapStyle);

  const terrainState = useMapStyleStore((s) => s.terrainState);
  const terrainLoading = useMapStyleStore((s) => s.terrainLoading);
  const setTerrainState = useMapStyleStore((s) => s.setTerrainState);

  const clickedPointMode = useMapStyleStore((s) => s.clickedPointMode);

  const { debounce, isDebouncing, clearAllDebounce } = useDebounceStore();

  useEffect(() => {
    return () => {
      clearAllDebounce();
    };
  }, [clearAllDebounce]);

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Palette className="w-5 h-5" />
        Kiểu bản đồ
      </h2>

      {/* Map Style Selection */}
      {clickedPointMode && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <span className="font-medium">Chế độ xem AQI đang bật.</span>
          <br />
          <span className="text-xs">Tắt chế độ để thay đổi kiểu bản đồ.</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {mapStyles.map((mapStyle) => {
          const isStyleChanging = isDebouncing("mapStyleChange");
          const isDisabled = isStyleChanging || clickedPointMode;

          return (
            <Tooltip key={mapStyle.name}>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    !isDisabled && selectedStyle === mapStyle.style
                      ? "soft-primary"
                      : "outline"
                  }
                  size="sm"
                  disabled={isDisabled}
                  className={`flex flex-col items-center w-full h-auto gap-1 p-2 rounded-lg ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : selectedStyle === mapStyle.style
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (isDisabled || selectedStyle === mapStyle.style) return;
                    setMapStyle(mapStyle.style);
                    debounce("mapStyleChange", () => {}, 1500);
                  }}
                >
                  <mapStyle.icon className="w-5 h-5" />
                  <span className="text-xs leading-tight text-center">
                    {mapStyle.name}
                  </span>
                </Button>
              </TooltipTrigger>

              <TooltipContent>
                {clickedPointMode
                  ? "Tắt chế độ AQI để thay đổi"
                  : mapStyle.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Display Options */}
      <div className="space-y-2">
        {/* 3D Terrain Toggle */}
        <label
          htmlFor="terrain"
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card transition-colors cursor-pointer hover:bg-accent/10"
        >
          <Checkbox
            id="terrain"
            checked={terrainState}
            disabled={terrainLoading}
            onCheckedChange={(checked) => {
              const nextTerrainState = checked === true;
              setTerrainState(nextTerrainState);
            }}
          />
          <div className="flex flex-col flex-1">
            <span className="text-sm font-medium text-foreground">
              Hiển thị địa hình 3D
            </span>
            <span className="text-xs text-muted-foreground">
              Bật/tắt hiển thị địa hình 3D
            </span>
          </div>
          {terrainLoading && <LoadingInline size="small" />}
        </label>
      </div>
    </div>
  );
}
