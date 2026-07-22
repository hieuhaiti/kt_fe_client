import { Layers, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWeatherLayerStore } from "@/stores/Map/Sidebar/useWeatherLayerStore";

export function WeatherSelection() {
  const { weatherLayers, toggleWeatherLayerEnabled, resetWeatherLayers } =
    useWeatherLayerStore();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="size-5" />
          Lớp thời tiết
        </h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={resetWeatherLayers}
              aria-label="Đặt lại lớp thời tiết"
            >
              <RefreshCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Đặt lại lớp thời tiết</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-col gap-3">
        {weatherLayers
          .filter((layer) => layer.visible)
          .map((layer) => (
            <div
              key={layer.id}
              className="rounded-lg border border-border bg-card p-3 shadow-sm"
            >
              <label
                htmlFor={`weather-layer-${layer.id}`}
                className="flex cursor-pointer items-center gap-3"
              >
                <Checkbox
                  id={`weather-layer-${layer.id}`}
                  checked={layer.enabled}
                  onCheckedChange={() => toggleWeatherLayerEnabled(layer.id)}
                />
                <layer.icon
                  className="size-4 shrink-0"
                  style={{ color: layer.color_code }}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {layer.name}
                </span>
              </label>
            </div>
          ))}
      </div>
    </div>
  );
}
