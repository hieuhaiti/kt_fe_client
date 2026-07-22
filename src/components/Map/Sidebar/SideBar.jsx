import { useEffect } from "react";
import { trackMapping } from "@/constant/sidebarData";
import HighlightHandle from "./elements/Datalyer/HighlightHandle";
import { useMapStore } from "../../../stores/Map/useMapStore";

export default function Sidebar() {
  const activePanel = useMapStore((s) => s.activePanel);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const highlightedFeature = useMapStore((s) => s.highlightedFeature);

  useEffect(() => {
    if (activePanel === null) {
      const defaultPanel =
        trackMapping.find((item) => item.default)?.id || trackMapping[0]?.id;
      if (defaultPanel) setActivePanel(defaultPanel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeItem = trackMapping.find((i) => i.id === activePanel);

  if (!activeItem) return null;

  return (
    <div className="flex flex-row h-full gap-2 bg-background pr-2">
      <div className="h-full flex flex-col overflow-hidden w-76 bg-card rounded-lg shadow-lg border border-border">
        <div className="sticky top-0 z-10 px-3 py-2 bg-card border-b border-border flex items-center gap-2">
          {activeItem.icon && (
            <activeItem.icon className="w-4 h-4 text-primary shrink-0" />
          )}
          <h3 className="text-sm font-semibold text-foreground truncate">
            {activeItem.label}
          </h3>
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
