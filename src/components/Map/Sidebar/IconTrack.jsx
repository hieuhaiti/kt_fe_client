import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { trackMapping } from "@/constant/sidebarData";
import { useMapStore } from "@/stores/Map/useMapStore";

/**
 * Floating horizontal control bar - đặt trên top-center của map.
 * Hiển thị đầy đủ icon + label cho từng panel; click để active panel.
 */
export default function IconTrack() {
  const activePanel = useMapStore((s) => s.activePanel);
  const setActivePanel = useMapStore((s) => s.setActivePanel);

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-card/90 backdrop-blur-sm border border-border shadow-lg">
        {trackMapping.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? "soft-primary" : "ghost"}
                  onClick={() => setActivePanel(isActive ? null : item.id)}
                  className="h-9 px-3 gap-2 rounded-md"
                  aria-label={item.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.color || ""}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              </TooltipTrigger>
              {item.description && (
                <TooltipContent side="bottom" className="border-border max-w-xs">
                  {item.description}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
