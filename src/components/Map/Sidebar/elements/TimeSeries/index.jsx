import { useCallback, useEffect, useMemo } from "react";
import { Clock, EyeOff, Gauge, Layers, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LoadingInline from "@/components/common/LoadingInline";
import { useMapStore } from "@/stores/Map/useMapStore";
import {
  useGetLayerGroupsQuery,
  useGetLayerGroupTimelineQuery,
} from "@/services/layerSeriesService";
import { buildWmsTileUrl } from "@/helper/Map/geoserver/wms";

const DEFAULT_AUTOPLAY_MS = 1400;
const SPEED_PRESETS = [
  { value: 500, label: "0.5s" },
  { value: 800, label: "0.8s" },
  { value: 1400, label: "1.4s" },
  { value: 2500, label: "2.5s" },
  { value: 4000, label: "4.0s" },
];

function unwrapItems(response) {
  return (
    response?.data?.items ||
    response?.data?.layers ||
    response?.items ||
    response?.data ||
    []
  );
}

function unwrapObject(response) {
  return response?.data ?? response ?? null;
}

function GroupCard({ group, isEnabled, onToggle }) {
  return (
    <label
      htmlFor={`ts-group-${group.code}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-all cursor-pointer hover:bg-accent/10 hover:shadow-md"
    >
      <Checkbox
        id={`ts-group-${group.code}`}
        checked={isEnabled}
        onCheckedChange={() => onToggle(group)}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {group.name_vi}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {group.step_count ?? 0} ảnh · {group.min_year ?? "—"}–
          {group.max_year ?? "—"}
        </span>
      </span>
    </label>
  );
}

function TimelinePanel({ group, onClose }) {
  const setTimeSeriesLayer = useMapStore((s) => s.setTimeSeriesLayer);
  const removeTimeSeriesLayer = useMapStore((s) => s.removeTimeSeriesLayer);
  const panelState = useMapStore(
    (s) => s.timeSeriesPanelState[group.code],
  );
  const setPanelState = useMapStore((s) => s.setTimeSeriesPanelState);

  const { data, isLoading, isError } = useGetLayerGroupTimelineQuery(
    group.code,
    {},
    { staleTime: 5 * 60 * 1000 },
  );

  const timeline = useMemo(() => unwrapObject(data), [data]);
  const steps = useMemo(() => timeline?.steps || [], [timeline]);
  const defaultIndex = useMemo(() => {
    if (!steps.length) return 0;
    return typeof timeline?.default_index === "number"
      ? Math.max(0, Math.min(steps.length - 1, timeline.default_index))
      : steps.length - 1;
  }, [timeline, steps]);

  const rawStepIndex = panelState?.stepIndex;
  const isPlaying = !!panelState?.isPlaying;
  const intervalMs = panelState?.intervalMs || DEFAULT_AUTOPLAY_MS;
  const stepIndex =
    rawStepIndex != null && rawStepIndex >= 0 && rawStepIndex < steps.length
      ? rawStepIndex
      : defaultIndex;

  const patchPanel = useCallback(
    (patch) => setPanelState(group.code, patch),
    [group.code, setPanelState],
  );

  useEffect(() => {
    const step = steps[stepIndex];
    if (!step?.geoserver_layer) return;
    // Tự build tile URL từ geoserver_layer bằng env client-side (VITE_GEOSERVER_URL)
    // thay vì dùng step.tile_url do server sinh (đang trả URL nội bộ localhost).
    const tileUrl = buildWmsTileUrl({ geoserver_layer: step.geoserver_layer });
    if (!tileUrl) return;
    setTimeSeriesLayer(group.code, {
      group,
      step,
      tileUrl,
      opacity: 0.85,
    });
  }, [stepIndex, steps, group, setTimeSeriesLayer]);

  useEffect(() => {
    if (!isPlaying || steps.length < 2) return undefined;
    const id = window.setInterval(() => {
      const { timeSeriesPanelState } = useMapStore.getState();
      const prev = timeSeriesPanelState[group.code]?.stepIndex;
      const base = prev == null ? defaultIndex : prev;
      patchPanel({ stepIndex: (base + 1) % steps.length });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [isPlaying, steps.length, intervalMs, defaultIndex, group.code, patchPanel]);

  const handleHide = () => {
    removeTimeSeriesLayer(group.code);
    onClose?.();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-card px-3 py-6">
        <LoadingInline size="small" />
      </div>
    );
  }

  if (isError || !timeline) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
        Không thể tải chuỗi thời gian cho lớp này.
      </div>
    );
  }

  if (!steps.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
        Chưa có ảnh nào cho lớp này.
      </div>
    );
  }

  const currentStep = steps[stepIndex];

  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{group.name_vi}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bước {stepIndex + 1}/{steps.length} ·{" "}
            <span className="font-medium text-foreground">
              {currentStep?.label}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPlaying ? "soft-primary" : "outline"}
                size="icon-sm"
                onClick={() => patchPanel({ isPlaying: !isPlaying })}
                disabled={steps.length < 2}
                aria-label={isPlaying ? "Tạm dừng" : "Chạy tự động"}
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPlaying ? "Tạm dừng phát" : "Phát tự động"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleHide}
                aria-label="Ẩn lớp ảnh theo thời gian"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ẩn khỏi bản đồ</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Slider
        min={0}
        max={Math.max(0, steps.length - 1)}
        step={1}
        value={[stepIndex]}
        onValueChange={([next]) => {
          if (typeof next !== "number") return;
          patchPanel({ stepIndex: next, isPlaying: false });
        }}
        variant="gradient-primary"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{steps[0]?.label}</span>
          <span>{steps[steps.length - 1]?.label}</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Gauge className="h-3 w-3 text-muted-foreground" />
              <Select
                value={String(intervalMs)}
                onValueChange={(v) =>
                  patchPanel({ intervalMs: Number(v) || DEFAULT_AUTOPLAY_MS })
                }
              >
                <SelectTrigger
                  size="sm"
                  className="h-6 gap-1 px-1.5 text-[10px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {SPEED_PRESETS.map((preset) => (
                    <SelectItem
                      key={preset.value}
                      value={String(preset.value)}
                      className="text-xs"
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>Tốc độ phát tự động</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function TimeSeries() {
  const timeSeriesLayersData = useMapStore((s) => s.timeSeriesLayersData);
  const setTimeSeriesLayer = useMapStore((s) => s.setTimeSeriesLayer);
  const removeTimeSeriesLayer = useMapStore((s) => s.removeTimeSeriesLayer);

  const { data, isLoading, isError } = useGetLayerGroupsQuery(
    {},
    { staleTime: 5 * 60 * 1000 },
  );

  const groups = useMemo(() => unwrapItems(data), [data]);

  const enabledGroups = useMemo(
    () =>
      groups.filter((group) =>
        Boolean(timeSeriesLayersData?.[group.code]),
      ),
    [groups, timeSeriesLayersData],
  );

  const handleToggle = useCallback(
    (group) => {
      if (timeSeriesLayersData?.[group.code]) {
        removeTimeSeriesLayer(group.code);
        return;
      }
      // Set placeholder entry so the checkbox reflects "enabled" immediately;
      // TimelinePanel will replace it with a real tileUrl once loaded.
      setTimeSeriesLayer(group.code, { group, step: null, tileUrl: null });
    },
    [timeSeriesLayersData, setTimeSeriesLayer, removeTimeSeriesLayer],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="h-5 w-5" />
          Ảnh theo thời gian
        </h2>
      </div>

      <p className="text-xs text-muted-foreground">
        Chọn nhóm lớp và kéo thanh trượt để xem biến động theo năm.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <LoadingInline size="small" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-4 text-sm text-destructive">
          Không thể tải danh sách lớp thời gian.
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-3 py-4 text-sm text-muted-foreground">
          Chưa có nhóm lớp thời gian nào.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <GroupCard
              key={group.code}
              group={group}
              isEnabled={Boolean(timeSeriesLayersData?.[group.code])}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {enabledGroups.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Thanh thời gian
          </p>
          {enabledGroups.map((group) => (
            <TimelinePanel
              key={group.code}
              group={group}
              onClose={() => removeTimeSeriesLayer(group.code)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TimeSeries;
