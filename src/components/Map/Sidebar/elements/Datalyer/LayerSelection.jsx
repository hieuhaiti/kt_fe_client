import { useCallback, useEffect, useMemo, useRef } from "react";
import { Database, Eye, EyeOff, Layers, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LoadingInline from "@/components/common/LoadingInline";
import { useDataLayerStore } from "@/stores/Map/Sidebar/useDataLayerStore";
import { useMapStore } from "@/stores/Map/useMapStore";
import { useGetMapLayersQuery } from "@/services/mapLayersService";
import { buildOgcSourceId } from "@/helper/Map/MapHelper";

function LayerItem({ layer, onToggle }) {
  const sourceId = buildOgcSourceId(layer);
  const prevEnabledRef = useRef(layer.enabled);

  useEffect(() => {
    if (layer.enabled) {
      useMapStore.getState().setOgcLayerData(sourceId, layer);
    }
  }, [layer, layer.enabled, sourceId]);

  useEffect(() => {
    if (prevEnabledRef.current && !layer.enabled) {
      useMapStore.getState().removeOgcLayerData(sourceId);
    }

    prevEnabledRef.current = layer.enabled;
  }, [layer.enabled, sourceId]);

  return (
    <label
      htmlFor={`ogc-layer-${layer.id}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-all cursor-pointer hover:bg-accent/10 hover:shadow-md"
    >
      <Checkbox
        id={`ogc-layer-${layer.id}`}
        checked={layer.enabled}
        onCheckedChange={() => onToggle(layer.id)}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {layer.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {layer.feature_count || 0} đối tượng
        </span>
      </span>
    </label>
  );
}

export function LayerSelection() {
  const {
    ogcLayers,
    setOgcLayerState,
    toggleOgcLayerEnabled,
    resetOgcLayers,
    enableAllOgcLayers,
  } = useDataLayerStore();

  const {
    data: mapLayersData,
    isLoading,
    isError,
  } = useGetMapLayersQuery(
    {
      page: 1,
      limit: 100,
      layer_kind: "basemap",
    },
    { staleTime: 2 * 60 * 1000 },
  );

  const mapLayers = useMemo(() => {
    const items =
      mapLayersData?.data?.items ||
      mapLayersData?.data?.layers ||
      mapLayersData?.items ||
      [];

    return items.filter((layer) => layer?.is_active && layer?.geoserver_layer);
  }, [mapLayersData]);

  useEffect(() => {
    setOgcLayerState(mapLayers);
  }, [mapLayers, setOgcLayerState]);

  useEffect(() => {
    const enabledSourceIds = new Set(
      ogcLayers.filter((layer) => layer.enabled).map(buildOgcSourceId),
    );
    const { ogcLayersData, removeOgcLayerData } = useMapStore.getState();

    Object.keys(ogcLayersData).forEach((sourceId) => {
      if (!enabledSourceIds.has(sourceId)) {
        removeOgcLayerData(sourceId);
      }
    });
  }, [ogcLayers]);

  const handleToggleLayer = useCallback(
    (layerId) => {
      toggleOgcLayerEnabled(layerId);
    },
    [toggleOgcLayerEnabled],
  );

  const handleEnableDefault = useCallback(() => {
    const { ogcLayers, toggleOgcLayerEnabled } = useDataLayerStore.getState();
    ogcLayers.forEach((layer) => {
      toggleOgcLayerEnabled(layer.id, !!layer.is_enable_default);
    });
  }, []);

  const handleDisableAll = useCallback(() => {
    useMapStore.getState().clearAllOgcLayersData();
    resetOgcLayers();
  }, [resetOgcLayers]);

  const handleEnableAll = useCallback(() => {
    enableAllOgcLayers();
  }, [enableAllOgcLayers]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="h-5 w-5" />
          Lớp dữ liệu
        </h2>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="soft-primary"
                size="icon-sm"
                onClick={handleEnableDefault}
                aria-label="Bật lớp dữ liệu mặc định"
              >
                <ListChecks className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bật mặc định</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="soft-primary"
                size="icon-sm"
                onClick={handleEnableAll}
                aria-label="Bật tất cả lớp dữ liệu"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bật tất cả</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleDisableAll}
                aria-label="Tắt tất cả lớp dữ liệu"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tắt tất cả</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <LoadingInline size="small" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-4 text-sm text-destructive">
          Không thể tải danh sách lớp dữ liệu.
        </div>
      ) : ogcLayers.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-3 py-4 text-sm text-muted-foreground">
          Chưa có lớp dữ liệu công khai.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {ogcLayers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              onToggle={handleToggleLayer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
