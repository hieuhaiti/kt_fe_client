import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { trackMapping } from "@/constant/sidebarData";
import { useMapStore } from "@/stores/Map/useMapStore";
import { cn } from "@/lib/utils";

/**
 * Floating horizontal control bar - đặt trên top-center của map.
 * Hiển thị đầy đủ icon + label cho từng panel; click để active panel.
 */
export default function IconTrack() {
  const activePanel = useMapStore((s) => s.activePanel);
  const setActivePanel = useMapStore((s) => s.setActivePanel);

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
      <div className="flex items-center gap-1 p-1 rounded-xl bg-card/95 backdrop-blur-md border border-border/80 shadow-md">
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
                  onClick={() => setActivePanel(item.id)}
                  className={cn(
                    "group h-9 px-2.5 sm:px-3 gap-1.5 sm:gap-2 rounded-lg transition-all",
                    isActive && "font-semibold shadow-xs"
                  )}
                  id={`map-sidebar-tab-${item.id}`}
                  aria-label={item.label}
                  aria-pressed={isActive}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "scale-105" : "opacity-85",
                      item.color || ""
                    )}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  <span className="text-xs sm:text-sm hidden xl:inline">{item.label}</span>
                </Button>
              </TooltipTrigger>
              {item.description && (
                <TooltipContent side="bottom" sideOffset={6} className="border-border text-xs max-w-xs">
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
