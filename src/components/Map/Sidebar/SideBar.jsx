import { trackMapping } from "@/constant/sidebarData";
import HighlightHandle from "./elements/Datalyer/HighlightHandle";
import { useMapStore } from "../../../stores/Map/useMapStore";

export default function Sidebar() {
  const activePanel = useMapStore((s) => s.activePanel);
  const highlightedFeature = useMapStore((s) => s.highlightedFeature);

  const activeItem = trackMapping.find((i) => i.id === activePanel);

  if (!activeItem) return null;

  return (
    <div className="flex flex-row h-full min-h-0 w-full gap-2 bg-background lg:pr-2">
      <div className="h-full min-h-0 flex flex-col overflow-hidden w-full bg-card rounded-lg shadow-lg border border-border">
        <div className="sticky top-0 z-10 px-3 py-2 bg-card border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {activeItem.icon && (
              <activeItem.icon className="w-4 h-4 text-primary shrink-0" />
            )}
            <h3 className="text-sm font-semibold text-foreground truncate">
              {activeItem.label}
            </h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent p-3">
          {activeItem.component && <activeItem.component />}
        </div>

        <hr className="p-1 bg-background " />

        {highlightedFeature && (
          <div className="px-3 p-2 border-t border-border">
            <HighlightHandle />
          </div>
        )}
      </div>
    </div>
  );
}
