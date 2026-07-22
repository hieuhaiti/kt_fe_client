import { memo } from "react";
import { Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMapStore } from "@/stores/Map/useMapStore";
import { useMapStyleStore } from "@/stores/Map/Sidebar/useMapStyleStore";
import { highlightFeatureOnMap, resetViewPort } from "@/helper/Map/MapHelper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Panel hiển thị trạng thái highlight trên map
 * Click vào để re-highlight + fly đến đối tượng, click trash để xóa và reset viewport
 */
function HighlightHandle() {
  const highlightedFeature = useMapStore((s) => s.highlightedFeature);
  const clearHighlightedFeature = useMapStore((s) => s.clearHighlightedFeature);
  const getMap = useMapStore((s) => s.getMap);
  const terrainState = useMapStyleStore((s) => s.terrainState);

  if (!highlightedFeature) return null;

  const name =
    highlightedFeature.name ||
    highlightedFeature.properties?.name ||
    "Đối tượng đánh dấu";

  const handleFly = () => {
    const map = getMap();
    if (map) highlightFeatureOnMap(map, highlightedFeature);
  };

  const handleClear = () => {
    clearHighlightedFeature();
    const map = getMap();
    if (map) resetViewPort(map, terrainState);
  };

  return (
    <Card className="w-full p-2">
      <CardContent className="p-2">
        <div
          onClick={handleFly}
          className="flex items-center justify-between gap-2 p-1 rounded-lg transition-all
            hover:cursor-pointer hover:bg-accent/10 active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {name}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="soft-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="shrink-0"
                aria-label="Xóa đối tượng đánh dấu"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xóa đối tượng đánh dấu</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(HighlightHandle);
