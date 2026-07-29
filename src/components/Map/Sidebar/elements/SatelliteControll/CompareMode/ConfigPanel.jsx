import React, { useState, useCallback, useEffect } from "react";
import {
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Settings,
  Calendar,
  Info,
} from "lucide-react";
import LoadingInline from "@/components/common/LoadingInline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSatelliteStore } from "@/stores/Map/Sidebar/useSatelliteStore";
import { useMapStore } from "@/stores/Map/useMapStore";
import { useLoadingStore } from "@/stores/common/useLoadingStore";
import { COMPARE_LAYER_ENTRIES, LAYER_CONFIG } from "../shared/layerConfig";
import {
  formatDateForInput,
  isValidDateObject,
  parseDateInputValue,
} from "../shared/utils";
import { WarningBanner } from "../shared/WarningBanner";
import {
  LABELS,
  COLLECTION_OPTIONS,
  CLOUD_COVER_MIN,
  CLOUD_COVER_MAX,
} from "../shared/constants";
import { Slider } from "@/components/ui/slider";

/**
 * Configuration panel for CompareMode.
 * Includes two stacked date-range cards (Period 1 / Period 2),
 * layer checkboxes, collection selector, and cloud-cover slider.
 */
function ConfigPanel() {
  const {
    startDate1,
    endDate1,
    startDate2,
    endDate2,
    collection,
    cloudCover,
    activeLayerTypes,
    isLoading,
    setStartDate1,
    setEndDate1,
    setStartDate2,
    setEndDate2,
    setCloudCover,
    toggleLayerType,
    setIsLoading,
    setError,
    setPeriod1Data,
    setPeriod2Data,
    setIsCompareMode,
    clearPeriodData,
    clearData,
    resetCompareSettings,
  } = useSatelliteStore();
  const setSplitMode = useMapStore((s) => s.setSplitMode);

  const [open, setOpen] = useState(true);

  const { setLoading } = useLoadingStore();

  useEffect(() => {
    setIsCompareMode(true);
    setSplitMode(true);
    return () => setSplitMode(false);
  }, [setIsCompareMode, setSplitMode]);

  const handlePeriodDateChange = useCallback(
    ({ value, pairDate, isStart, applyDate }) => {
      const parsedDate = parseDateInputValue(value);
      if (!parsedDate) {
        setError(LABELS.errorInvalidDate);
        return;
      }

      const isOrderValid = isStart
        ? parsedDate < pairDate
        : parsedDate > pairDate;
      if (!isOrderValid) {
        setError(LABELS.errorDateOrder);
        return;
      }

      applyDate(parsedDate);
      setError(null);
    },
    [setError],
  );

  const handleAnalyze = useCallback(async () => {
    if (activeLayerTypes.size === 0) {
      setError(LABELS.errorNoLayer);
      return;
    }
    const hasInvalidDates =
      !isValidDateObject(startDate1) ||
      !isValidDateObject(endDate1) ||
      !isValidDateObject(startDate2) ||
      !isValidDateObject(endDate2);
    if (hasInvalidDates) {
      setError(LABELS.errorInvalidDate);
      return;
    }

    if (startDate1 >= endDate1 || startDate2 >= endDate2) {
      setError(LABELS.errorDateOrder);
      return;
    }

    setIsLoading(true);
    setLoading(true);
    setError(null);
    clearPeriodData();

    try {
      const params1 = {
        startDate: startDate1.toISOString().split("T")[0],
        endDate: endDate1.toISOString().split("T")[0],
        collection,
        cloudCover,
      };
      const params2 = {
        startDate: startDate2.toISOString().split("T")[0],
        endDate: endDate2.toISOString().split("T")[0],
        collection,
        cloudCover,
      };

      // Load regular comparison layers for both periods
      for (const layerType of activeLayerTypes) {
        try {
          const result1 = await LAYER_CONFIG[layerType].service(params1);
          setPeriod1Data(layerType, result1?.data || result1);
          const result2 = await LAYER_CONFIG[layerType].service(params2);
          setPeriod2Data(layerType, result2?.data || result2);
        } catch (err) {
          console.error(`[${layerType}]`, err);
          setPeriod1Data(layerType, { error: err.message });
          setPeriod2Data(layerType, { error: err.message });
        }
      }
    } catch (err) {
      setError(err.message || LABELS.errorGeneric);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [
    activeLayerTypes,
    startDate1,
    endDate1,
    startDate2,
    endDate2,
    collection,
    cloudCover,
    setIsLoading,
    setError,
    setPeriod1Data,
    setPeriod2Data,
    setLoading,
    clearPeriodData,
  ]);

  const applySamePeriodLastYear = () => {
    const previousStart = new Date(startDate1);
    previousStart.setFullYear(previousStart.getFullYear() - 1);
    const previousEnd = new Date(endDate1);
    previousEnd.setFullYear(previousEnd.getFullYear() - 1);
    setStartDate2(previousStart);
    setEndDate2(previousEnd);
    setError(null);
  };
  const period1Days = Math.round((endDate1 - startDate1) / 86_400_000);
  const period2Days = Math.round((endDate2 - startDate2) / 86_400_000);
  const sameSeason =
    startDate1.getMonth() === startDate2.getMonth() &&
    endDate1.getMonth() === endDate2.getMonth();

  return (
    <div className="bg-card">
      {/* Header - always visible */}
      <Button
        type="button"
        variant={open ? "soft-primary" : "outline"}
        onClick={() => setOpen(!open)}
        className="h-auto w-full justify-between rounded-none px-3 py-2"
        aria-expanded={open}
      >
        <div className="flex flex-1 items-center gap-2">
          <Settings size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {LABELS.configCompareTitle}
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-foreground/60" />
        ) : (
          <ChevronDown size={16} className="text-foreground/60" />
        )}
      </Button>

      {/* Warning banner - always visible */}
      <WarningBanner />

      {/* Collapsible content */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "1000px" : "0px" }}
      >
        <div className="border-t border-border px-3 py-3 space-y-3">
          {/* Date Range */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar size={13} />
              {LABELS.timeRangeCompare}
            </h4>

            {/* Period 1 */}
            <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-blue-500">
                {LABELS.period1}
              </p>
              <div className="space-y-1.5">
                <div>
                  <label className="text-xs text-foreground/60 mb-1 block">
                    {LABELS.from}
                  </label>
                  <Input
                    type="date"
                    value={formatDateForInput(startDate1)}
                    onChange={(e) =>
                      handlePeriodDateChange({
                        value: e.target.value,
                        pairDate: endDate1,
                        isStart: true,
                        applyDate: setStartDate1,
                      })
                    }
                    disabled={isLoading}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/60 mb-1 block">
                    {LABELS.to}
                  </label>
                  <Input
                    type="date"
                    value={formatDateForInput(endDate1)}
                    onChange={(e) =>
                      handlePeriodDateChange({
                        value: e.target.value,
                        pairDate: startDate1,
                        isStart: false,
                        applyDate: setEndDate1,
                      })
                    }
                    disabled={isLoading}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* Period 2 */}
            <div className="p-2.5 bg-orange-500/5 border border-orange-500/20 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-orange-500">
                {LABELS.period2}
              </p>
              <div className="space-y-1.5">
                <div>
                  <label className="text-xs text-foreground/60 mb-1 block">
                    {LABELS.from}
                  </label>
                  <Input
                    type="date"
                    value={formatDateForInput(startDate2)}
                    onChange={(e) =>
                      handlePeriodDateChange({
                        value: e.target.value,
                        pairDate: endDate2,
                        isStart: true,
                        applyDate: setStartDate2,
                      })
                    }
                    disabled={isLoading}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/60 mb-1 block">
                    {LABELS.to}
                  </label>
                  <Input
                    type="date"
                    value={formatDateForInput(endDate2)}
                    onChange={(e) =>
                      handlePeriodDateChange({
                        value: e.target.value,
                        pairDate: startDate2,
                        isStart: false,
                        applyDate: setEndDate2,
                      })
                    }
                    disabled={isLoading}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={applySamePeriodLastYear}
              disabled={isLoading}
              className="w-full"
            >
              Đặt kỳ đối chiếu cùng thời gian năm trước
            </Button>

            <aside
              role="note"
              className={`rounded-lg border p-2.5 text-[11px] leading-relaxed ${
                sameSeason && period1Days === period2Days
                  ? "border-success/30 bg-success/10 text-success-foreground"
                  : "border-warning/30 bg-warning/10 text-warning-foreground"
              }`}
            >
              <p className="flex items-center gap-1.5 font-semibold">
                <Info className="h-3.5 w-3.5 shrink-0" />
                {sameSeason && period1Days === period2Days
                  ? "Hai khoảng thời gian tương đồng"
                  : "Nên chọn cùng mùa và cùng số ngày"}
              </p>
              <p className="mt-1">
                So sánh cùng thời gian giữa hai năm giúp giảm chênh lệch tự
                nhiên do mùa. Mây và số lượng ảnh khác nhau vẫn có thể làm màu
                sắc hoặc chỉ số thay đổi.
              </p>
            </aside>
          </div>

          {/* Layer Types */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
              {LABELS.layerTypes}
            </h4>
            <div className="space-y-2">
              {COMPARE_LAYER_ENTRIES.map(([layerId, config]) => (
                <Tooltip key={layerId} delayDuration={200}>
                  <TooltipTrigger asChild>
                    <label
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        isLoading
                          ? "opacity-50 cursor-not-allowed bg-surface-muted"
                          : "hover:bg-surface-muted border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Checkbox
                          checked={activeLayerTypes.has(layerId)}
                          onCheckedChange={() => toggleLayerType(layerId)}
                          disabled={isLoading}
                          className="h-4 w-4"
                        />
                        <div
                          className={`w-3 h-3 rounded-full ${config.color}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">
                            {config.label}
                          </p>
                          <p className="text-xs text-foreground/50 truncate">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </label>
                  </TooltipTrigger>
                  {isLoading && (
                    <TooltipContent className="text-xs">
                      {LABELS.loadingTooltip}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
              {LABELS.settings}
            </h4>
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs text-foreground/60 shrink-0">
                {LABELS.collection}
              </label>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                {COLLECTION_OPTIONS.find((opt) => opt.value === collection)
                  ?.label || collection}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-foreground/60">
                  {LABELS.cloudCover}
                </label>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  {cloudCover}%
                </span>
              </div>
              <Slider
                min={CLOUD_COVER_MIN}
                max={CLOUD_COVER_MAX}
                step={5}
                value={[cloudCover]}
                onValueChange={(vals) => setCloudCover(vals[0])}
                disabled={isLoading}
                className="w-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="gradient-info"
              onClick={handleAnalyze}
              disabled={isLoading || activeLayerTypes.size === 0}
              className="flex-1 gap-2 h-8"
            >
              {isLoading ? (
                <>
                  <LoadingInline size="small" color="primary" />
                  <span className="text-xs">{LABELS.loading}</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span className="text-xs">{LABELS.loadImage}</span>
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                clearData();
                resetCompareSettings();
              }}
              variant="outline"
              disabled={isLoading}
              className="flex-1 gap-2 h-8"
            >
              <RotateCcw size={14} />
              <span className="text-xs">{LABELS.reset}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigPanel;
