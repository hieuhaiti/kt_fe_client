import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Map as MapIcon,
} from "lucide-react";
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

const UNCATEGORIZED_KEY = "__uncategorized__";
const UNCATEGORIZED_LABEL = "Khác";

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

  const tooltipParts = [
    layer.description,
    layer.code ? `Mã: ${layer.code}` : null,
    layer.geometry_type ? `Kiểu: ${layer.geometry_type}` : null,
    layer.category ? `Danh mục: ${layer.category}` : null,
    typeof layer.feature_count === "number"
      ? `${layer.feature_count} đối tượng`
      : null,
  ].filter(Boolean);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1">
          <div className="font-semibold text-sm">{layer.name}</div>
          {tooltipParts.length > 0 ? (
            <div className="text-xs opacity-90 whitespace-pre-line">
              {tooltipParts.join("\n")}
            </div>
          ) : (
            <div className="text-xs opacity-70">Không có mô tả</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  defaultOpen = false,
  actions,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ChevronIcon = open ? ChevronDown : ChevronRight;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
          aria-expanded={open}
        >
          <ChevronIcon className="h-4 w-4" />
          {Icon ? <Icon className="h-5 w-5" /> : null}
          <span>{title}</span>
          {typeof count === "number" ? (
            <span className="text-xs font-normal text-muted-foreground">
              ({count})
            </span>
          ) : null}
        </button>
        {actions ? <div className="flex gap-1">{actions}</div> : null}
      </div>
      {open ? children : null}
    </div>
  );
}

function CategoryGroup({ category, layers, onToggle, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const ChevronIcon = open ? ChevronDown : ChevronRight;
  const enabledCount = layers.filter((l) => l.enabled).length;

  return (
    <div className="rounded-lg border border-border bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/10 rounded-lg"
        aria-expanded={open}
      >
        <ChevronIcon className="h-4 w-4" />
        <span className="flex-1 text-left truncate">{category}</span>
        <span className="text-xs text-muted-foreground">
          {enabledCount}/{layers.length}
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-2 p-2 pt-0">
          {layers.map((layer) => (
            <LayerItem key={layer.id} layer={layer} onToggle={onToggle} />
          ))}
        </div>
      ) : null}
    </div>
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

  const overlayQuery = useGetMapLayersQuery(
    { page: 1, limit: 100, layer_kind: "overlay" },
    { staleTime: 2 * 60 * 1000 },
  );

  const basemapQuery = useGetMapLayersQuery(
    { page: 1, limit: 100, layer_kind: "basemap" },
    { staleTime: 2 * 60 * 1000 },
  );

  const isLoading = overlayQuery.isLoading || basemapQuery.isLoading;
  const isError = overlayQuery.isError || basemapQuery.isError;

  const mapLayers = useMemo(() => {
    const extract = (payload) =>
      payload?.data?.items ||
      payload?.data?.layers ||
      payload?.items ||
      [];

    const overlays = extract(overlayQuery.data).map((l) => ({
      ...l,
      layer_kind: "overlay",
    }));
    const basemaps = extract(basemapQuery.data).map((l) => ({
      ...l,
      layer_kind: "basemap",
    }));

    return [...basemaps, ...overlays].filter(
      (layer) => layer?.is_active && layer?.geoserver_layer,
    );
  }, [overlayQuery.data, basemapQuery.data]);

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

  const basemapLayers = useMemo(
    () => ogcLayers.filter((l) => l.layer_kind === "basemap"),
    [ogcLayers],
  );

  const overlayLayers = useMemo(
    () => ogcLayers.filter((l) => l.layer_kind !== "basemap"),
    [ogcLayers],
  );

  const overlayCategories = useMemo(() => {
    const groups = new Map();
    overlayLayers.forEach((layer) => {
      const key = layer.category || UNCATEGORIZED_KEY;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(layer);
    });
    return Array.from(groups.entries()).map(([key, layers]) => ({
      key,
      label: key === UNCATEGORIZED_KEY ? UNCATEGORIZED_LABEL : key,
      layers,
    }));
  }, [overlayLayers]);

  const handleEnableAllOverlays = useCallback(() => {
    const overlayIds = overlayLayers.map((l) => l.id);
    overlayIds.forEach((id) => toggleOgcLayerEnabled(id, true));
  }, [overlayLayers, toggleOgcLayerEnabled]);

  const handleDisableAllOverlays = useCallback(() => {
    overlayLayers.forEach((l) => {
      if (l.enabled) {
        useMapStore.getState().removeOgcLayerData(buildOgcSourceId(l));
      }
      toggleOgcLayerEnabled(l.id, false);
    });
  }, [overlayLayers, toggleOgcLayerEnabled]);

  const handleEnableAllBasemaps = useCallback(() => {
    basemapLayers.forEach((l) => toggleOgcLayerEnabled(l.id, true));
  }, [basemapLayers, toggleOgcLayerEnabled]);

  const handleDisableAllBasemaps = useCallback(() => {
    basemapLayers.forEach((l) => {
      if (l.enabled) {
        useMapStore.getState().removeOgcLayerData(buildOgcSourceId(l));
      }
      toggleOgcLayerEnabled(l.id, false);
    });
  }, [basemapLayers, toggleOgcLayerEnabled]);

  // Preserve top-level "enable all / disable all" buttons for backward compat
  const handleDisableAll = useCallback(() => {
    useMapStore.getState().clearAllOgcLayersData();
    resetOgcLayers();
  }, [resetOgcLayers]);

  const handleEnableAll = useCallback(() => {
    enableAllOgcLayers();
  }, [enableAllOgcLayers]);

  const bulkActions = (
    <>
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
    </>
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="h-5 w-5" />
          Lớp dữ liệu
        </h2>
        <div className="flex items-center justify-center py-6">
          <LoadingInline size="small" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="h-5 w-5" />
          Lớp dữ liệu
        </h2>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-4 text-sm text-destructive">
          Không thể tải danh sách lớp dữ liệu.
        </div>
      </div>
    );
  }

  if (ogcLayers.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="h-5 w-5" />
          Lớp dữ liệu
        </h2>
        <div className="rounded-lg border border-border bg-card px-3 py-4 text-sm text-muted-foreground">
          Chưa có lớp dữ liệu công khai.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="h-5 w-5" />
          Lớp dữ liệu
        </h2>
        <div className="flex gap-1">{bulkActions}</div>
      </div>

      {basemapLayers.length > 0 ? (
        <CollapsibleSection
          title="Lớp nền"
          icon={MapIcon}
          count={basemapLayers.length}
          defaultOpen
          actions={
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="soft-primary"
                    size="icon-sm"
                    onClick={handleEnableAllBasemaps}
                    aria-label="Bật tất cả lớp nền"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bật tất cả lớp nền</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={handleDisableAllBasemaps}
                    aria-label="Tắt tất cả lớp nền"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tắt tất cả lớp nền</TooltipContent>
              </Tooltip>
            </>
          }
        >
          <div className="flex flex-col gap-2">
            {basemapLayers.map((layer) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                onToggle={handleToggleLayer}
              />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {overlayLayers.length > 0 ? (
        <CollapsibleSection
          title="Lớp phủ"
          icon={Layers}
          count={overlayLayers.length}
          defaultOpen={false}
          actions={
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="soft-primary"
                    size="icon-sm"
                    onClick={handleEnableAllOverlays}
                    aria-label="Bật tất cả lớp phủ"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bật tất cả lớp phủ</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={handleDisableAllOverlays}
                    aria-label="Tắt tất cả lớp phủ"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tắt tất cả lớp phủ</TooltipContent>
              </Tooltip>
            </>
          }
        >
          <div className="flex flex-col gap-2">
            {overlayCategories.map((group) => (
              <CategoryGroup
                key={group.key}
                category={group.label}
                layers={group.layers}
                onToggle={handleToggleLayer}
                defaultOpen={false}
              />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
