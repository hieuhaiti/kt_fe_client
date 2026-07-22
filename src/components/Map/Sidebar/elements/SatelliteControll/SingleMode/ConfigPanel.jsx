import React, { useState, useCallback, useEffect } from "react";
import {
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import LoadingInline from "@/components/common/LoadingInline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useSatelliteStore } from "@/stores/Map/Sidebar/useSatelliteStore";
import { useLoadingStore } from "@/stores/common/useLoadingStore";
import { SINGLE_LAYER_ENTRIES, LAYER_CONFIG } from "../shared/layerConfig";
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
/**
 * Configuration panel for SingleMode: date range, layer selection, settings, and actions.
 */
function ConfigPanel() {
  const [open, setOpen] = useState(true);
  const [selectedLayers, setSelectedLayers] = useState(["rgb"]);

  const {
    startDate,
    endDate,
    collection,
    cloudCover,
    isLoading,
    setStartDate,
    setEndDate,
    setCollection,
    setCloudCover,
    setIsLoading,
    setError,
    setAnalysisData,
    syncSingleImagesFromResults,
    setIsCompareMode,
    clearData,
    reset,
  } = useSatelliteStore();

  const { setLoading } = useLoadingStore();

  // Khi vào SingleMode, chuyển mode về single (xóa ảnh compare nếu đang ở compare)
  useEffect(() => {
    setIsCompareMode(false);
  }, [setIsCompareMode]);

  const handleLayerToggle = (layerId) => {
    setSelectedLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((l) => l !== layerId)
        : [...prev, layerId],
    );
  };

  const handleStartDateChange = (e) => {
    const newDate = parseDateInputValue(e.target.value);
    if (!newDate) {
      setError(LABELS.errorInvalidDate);
      return;
    }

    if (newDate < endDate) {
      setStartDate(newDate);
      setError(null);
    } else {
      setError(LABELS.errorDateOrder);
    }
  };

  const handleEndDateChange = (e) => {
    const newDate = parseDateInputValue(e.target.value);
    if (!newDate) {
      setError(LABELS.errorInvalidDate);
      return;
    }

    if (newDate > startDate) {
      setEndDate(newDate);
      setError(null);
    } else {
      setError(LABELS.errorDateOrder);
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (selectedLayers.length === 0) {
      setError(LABELS.errorNoLayer);
      return;
    }
    if (!isValidDateObject(startDate) || !isValidDateObject(endDate)) {
      setError(LABELS.errorInvalidDate);
      return;
    }

    if (startDate >= endDate) {
      setError(LABELS.errorDateOrder);
      return;
    }

    setIsLoading(true);
    setLoading(true);
    setError(null);

    try {
      const params = {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        collection,
        cloudCover,
      };

      // Load selected regular layers
      const results = {};
      for (const layerId of selectedLayers) {
        try {
          const result = await LAYER_CONFIG[layerId].service(params);
          results[layerId] = result?.data || result;
        } catch (err) {
          console.error(`[${layerId}]`, err);
          results[layerId] = { error: err.message };
        }
      }

      if (selectedLayers.length > 0) {
        setAnalysisData(results);
        syncSingleImagesFromResults(results, {
          startDate,
          endDate,
          collection,
          cloudCover,
        });
      }
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(err.message || LABELS.errorGeneric);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }, [
    selectedLayers,
    startDate,
    endDate,
    collection,
    cloudCover,
    setIsLoading,
    setError,
    setAnalysisData,
    syncSingleImagesFromResults,
    setLoading,
  ]);

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
            {LABELS.configTitle}
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
            <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
              {LABELS.timeRange}
            </h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-foreground/60 mb-1 block">
                  {LABELS.from}
                </label>
                <Input
                  type="date"
                  value={formatDateForInput(startDate)}
                  onChange={handleStartDateChange}
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
                  value={formatDateForInput(endDate)}
                  onChange={handleEndDateChange}
                  disabled={isLoading}
                  className="text-xs h-8"
                />
              </div>
            </div>
          </div>

          {/* Layer Types */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
              {LABELS.layerTypes}
            </h4>
            <div className="space-y-2">
              {SINGLE_LAYER_ENTRIES.map(([layerId, config]) => (
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
                          checked={selectedLayers.includes(layerId)}
                          onCheckedChange={() => handleLayerToggle(layerId)}
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
              {/* <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                {COLLECTION_OPTIONS.find((opt) => opt.value === collection)?.label || collection}
              </span> */}
              <Select
                onValueChange={(value) => setCollection(value)}
                value={collection}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[150px] h-8">
                  <SelectValue placeholder={LABELS.selectCollection} />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <p className="text-[10px] text-foreground/40 leading-relaxed">
              Nguồn dữ liệu &amp; mức mây chỉ áp dụng cho Ảnh Màu, NDVI và Ảnh Nhiệt (LST). Ảnh Phân Loại được tổng hợp tự động từ nhiều nguồn ảnh.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="gradient-primary"
              onClick={handleAnalyze}
              disabled={isLoading || selectedLayers.length === 0}
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
                reset();
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
