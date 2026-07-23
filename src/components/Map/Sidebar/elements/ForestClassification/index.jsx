import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  EyeOff,
  GitCompareArrows,
  Layers,
  Loader2,
  RefreshCw,
  TreePine,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import {
  getForestClassificationLatest,
  getForestClassificationPublishedHistory,
  getForestClassificationSnapshot,
  queryForestClassification,
} from "@/features/map/api/forestClassificationApi";
import { buildWmsTileUrl } from "@/helper/Map/geoserver/wms";
import { buildWcsCoverageUrl } from "@/helper/Map/geoserver/wcs";
import { downloadRasterFile } from "@/lib/downloadRaster";
import { useMapStore } from "@/stores/Map/useMapStore";

const FOREST_HISTORY_SOURCE_PREFIX = "forest-class-history-source-";
const FOREST_HISTORY_LAYER_PREFIX = "forest-class-history-layer-";

// 11-class palette (mirrors server config)
const CLASS_PALETTE = [
  "#FFBEE8",
  "#FFEBB0",
  "#F0E442",
  "#FEFF73",
  "#AAFF03",
  "#D0FF73",
  "#E7E600",
  "#4DE600",
  "#FFAA01",
  "#73B2FF",
  "#55FF00",
];
const CLASS_NAMES = [
  "Đất khác",
  "Cây công nghiệp",
  "Đất nông nghiệp",
  "Rừng hỗn giao lá rộng, lá kim",
  "Rừng lá rộng thường xanh",
  "Rừng lá kim",
  "Rừng lá rộng rụng lá",
  "Rừng tre nứa",
  "Rừng trồng",
  "Sông, suối, hồ",
  "Trảng cỏ, cây bụi",
];
const FOREST_CLASS_IDS = [1, 3, 4, 5, 6, 7, 8];

const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

function formatArea(ha) {
  if (ha == null) return "—";
  if (Math.abs(ha) >= 10000) return `${(ha / 10000).toFixed(1)} vạn ha`;
  return `${ha.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ha`;
}

function formatAreaChange(metric) {
  if (!metric) return "—";
  const deltaHa = Number(metric.deltaHa) || 0;
  const changePct = metric.changePct;
  const sign = deltaHa > 0 ? "+" : "";
  const pct =
    changePct == null
      ? ""
      : ` (${Number(changePct) > 0 ? "+" : ""}${Number(changePct).toFixed(1)}%)`;
  return `${sign}${formatArea(deltaHa)}${pct}`;
}

function StatusBadge({ status }) {
  if (status === "published" || status === "completed")
    return <Badge variant="soft-success">Hoàn thành</Badge>;
  if (status === "computing" || status === "pending")
    return <Badge variant="soft-warning">Đang xử lý</Badge>;
  if (status === "failed") return <Badge variant="destructive">Thất bại</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function ClassRow({ classId, name, areaHa, totalHa }) {
  const isForest = FOREST_CLASS_IDS.includes(classId);
  const pct = totalHa > 0 ? ((areaHa / totalHa) * 100).toFixed(1) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="h-3 w-3 shrink-0 rounded-sm border border-border/40"
        style={{ backgroundColor: CLASS_PALETTE[classId] ?? "#ccc" }}
      />
      <span
        className={`flex-1 truncate ${isForest ? "font-medium text-foreground" : "text-muted-foreground"}`}
      >
        {name}
      </span>
      <span className="shrink-0 text-muted-foreground">{pct}%</span>
      <span className="w-20 shrink-0 text-right font-medium text-foreground">
        {formatArea(areaHa)}
      </span>
    </div>
  );
}

function ComparisonCard({ comparison }) {
  const previous = comparison?.previousSnapshot;
  const province = comparison?.province;
  if (!previous || !province) return null;

  const previousPeriod = `${String(previous.month).padStart(2, "0")}/${previous.year}`;
  const topChanges = [...(province.classes || [])]
    .filter((item) => Number(item.deltaHa) !== 0)
    .sort((a, b) => Math.abs(Number(b.deltaHa)) - Math.abs(Number(a.deltaHa)))
    .slice(0, 3);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border bg-muted/30 px-4 py-3">
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-1.5">
            <GitCompareArrows className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">So sánh kỳ gần nhất</span>
          </span>
          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
            {previousPeriod}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 py-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Tổng diện tích</p>
            <p className="mt-0.5 font-semibold tabular-nums text-foreground">
              {formatAreaChange(province.total)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Diện tích rừng</p>
            <p className="mt-0.5 font-semibold tabular-nums text-green-600">
              {formatAreaChange(province.forest)}
            </p>
          </div>
        </div>
        {topChanges.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
              Lớp biến động nhiều nhất
            </p>
            <div className="divide-y divide-border">
              {topChanges.map((item) => (
                <div key={item.classId} className="flex items-center gap-2 py-1.5 text-xs">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm border border-border"
                    style={{ backgroundColor: CLASS_PALETTE[item.classId] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {item.className || CLASS_NAMES[item.classId]}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-foreground">
                    {formatAreaChange(item)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function normalizeProvinceSummary(summary) {
  if (!summary) return [];

  if (Array.isArray(summary)) {
    return summary.map((item) => ({
      ...item,
      class_id: Number(item.class_id ?? item.classId),
      area_ha: Number(item.area_ha ?? item.areaHa) || 0,
    }));
  }

  const byClass = summary?.byClass ?? summary?.by_class ?? {};
  return CLASS_NAMES.map((name, classId) => ({
    class_id: classId,
    class_name: name,
    area_ha: Number(byClass[String(classId)] ?? byClass[classId]) || 0,
  }));
}

function toPublishedMapLayer(item) {
  const id = item?.id != null ? String(item.id) : "";
  const geoserverLayer = item?.geoserverLayer ?? item?.geoserver_layer ?? "";
  const year = Number(item?.year);
  const month = Number(item?.month);
  if (!id || !geoserverLayer) return null;

  const tileUrl = buildWmsTileUrl({ geoserver_layer: geoserverLayer });
  if (!tileUrl) return null;

  // Ưu tiên link tải WCS GeoServer (persistent, full-res). Server đã build sẵn
  // ở `/latest` + `/snapshot/:id` (formatSnapshot). Với item từ
  // `/published-history` (chỉ có `geoserver_layer`), fallback tự build client-
  // side. Cuối cùng fallback về `geeDownloadUrl` (GEE, TTL ~24h).
  const [workspacePart, layerPart] = geoserverLayer.includes(":")
    ? geoserverLayer.split(":")
    : [null, geoserverLayer];
  const wcsCoverageId = workspacePart
    ? `${workspacePart}__${layerPart}`
    : undefined;
  const clientBuiltWcs = buildWcsCoverageUrl(
    { geoserver_layer: geoserverLayer },
    wcsCoverageId ? { coverageId: wcsCoverageId } : {},
  );
  const geoserverDownloadUrl =
    item?.geoserverDownloadUrl ??
    item?.geoserver_download_url ??
    clientBuiltWcs ??
    null;
  const geeDownloadUrl = item?.geeDownloadUrl ?? item?.gee_download_url ?? null;
  const downloadUrl = geoserverDownloadUrl || geeDownloadUrl || null;
  const downloadSource = geoserverDownloadUrl
    ? "geoserver"
    : geeDownloadUrl
      ? "gee"
      : null;
  const downloadFilename =
    item?.downloadFilename ??
    (Number.isFinite(year) && Number.isFinite(month)
      ? `forest_class_kontum_${year}${String(month).padStart(2, "0")}.tif`
      : `forest_class_${id}.tif`);

  return {
    id,
    geoserverLayer,
    tileUrl,
    label:
      Number.isFinite(year) && Number.isFinite(month)
        ? `Phân loại rừng ${String(month).padStart(2, "0")}/${year}`
        : `Phân loại rừng #${id}`,
    visible: true,
    opacity: 0.75,
    downloadUrl,
    downloadSource,
    downloadFilename,
  };
}

function ensureForestRasterLayer(map, item) {
  const sourceId = `${FOREST_HISTORY_SOURCE_PREFIX}${item.id}`;
  const layerId = `${FOREST_HISTORY_LAYER_PREFIX}${item.id}`;

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "raster",
      tiles: [item.tileUrl],
      tileSize: 256,
      attribution: "GeoServer WMS — Phân loại lớp phủ rừng",
    });
  }
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: "raster",
      source: sourceId,
      paint: { "raster-opacity": item.opacity },
      layout: { visibility: item.visible ? "visible" : "none" },
    });
  } else {
    map.setPaintProperty(layerId, "raster-opacity", item.opacity);
    map.setLayoutProperty(
      layerId,
      "visibility",
      item.visible ? "visible" : "none",
    );
  }
}

function removeForestRasterLayer(map, id) {
  const sourceId = `${FOREST_HISTORY_SOURCE_PREFIX}${id}`;
  const layerId = `${FOREST_HISTORY_LAYER_PREFIX}${id}`;
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

function getForestRasterIds(map) {
  return (map.getStyle?.()?.layers || [])
    .map((layer) => layer.id)
    .filter((id) => id.startsWith(FOREST_HISTORY_LAYER_PREFIX))
    .map((id) => id.slice(FOREST_HISTORY_LAYER_PREFIX.length));
}

export function ForestClassification() {
  const mapInstance = useMapStore((state) => state.mapInstance);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState(null);
  const [publishedHistory, setPublishedHistory] = useState([]);
  const [selectedPublishedId, setSelectedPublishedId] = useState("");
  const [mapLayers, setMapLayers] = useState({});

  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [downloadingLayerId, setDownloadingLayerId] = useState(null);

  const pollRef = useRef(null);

  const handleDownloadLayer = useCallback(async (layer) => {
    if (!layer?.downloadUrl) return;
    setDownloadingLayerId(layer.id);
    try {
      await downloadRasterFile(layer.downloadUrl, layer.downloadFilename);
      toast.success(
        layer.downloadSource === "geoserver"
          ? "Đã tải GeoTIFF từ GeoServer."
          : "Đã tải GeoTIFF từ Earth Engine.",
      );
    } catch (err) {
      toast.error(err?.message || "Không thể tải GeoTIFF.");
    } finally {
      setDownloadingLayerId(null);
    }
  }, []);

  const activatePublishedLayer = useCallback((item) => {
    const layer = toPublishedMapLayer(item);
    if (!layer) return;
    setMapLayers((current) => ({
      ...current,
      [layer.id]: current[layer.id]
        ? { ...layer, ...current[layer.id] }
        : layer,
    }));
  }, []);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPoll = useCallback((snapshotId) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const res = await getForestClassificationSnapshot(snapshotId);
        const payload = res?.data ?? res;
        if (payload?.snapshot) {
          setData(payload);
          if (!payload.computing) stopPoll();
        }
      } catch {
        stopPoll();
      }
    }, 10000);
  }, [stopPoll]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    stopPoll();
    try {
      const res = await getForestClassificationLatest();
      const payload = res?.data ?? res;
      setData(payload);
      activatePublishedLayer(payload?.snapshot);
      if (payload?.computing && payload?.snapshot?.id) {
        startPoll(payload.snapshot.id);
      }
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu phân loại rừng.");
    } finally {
      setLoading(false);
    }
  }, [activatePublishedLayer, startPoll, stopPoll]);

  const loadPublishedHistory = useCallback(async () => {
    try {
      const res = await getForestClassificationPublishedHistory(1, 24);
      const items = res?.data?.data?.items ?? res?.data?.items ?? [];
      setPublishedHistory(
        Array.isArray(items)
          ? items.filter((item) => toPublishedMapLayer(item))
          : [],
      );
    } catch {
      setPublishedHistory([]);
    }
  }, []);

  useEffect(() => {
    load();
    loadPublishedHistory();
    return stopPoll;
  }, [load, loadPublishedHistory, stopPoll]);

  const handleQuery = async () => {
    if (!year || !month) return;
    setQuerying(true);
    setSelectedPublishedId("");
    setError(null);
    stopPoll();
    try {
      const res = await queryForestClassification(Number(year), Number(month));
      const payload = res?.data ?? res;
      setData(payload);
      if (payload?.computing && payload?.snapshot?.id) {
        startPoll(payload.snapshot.id);
      }
    } catch (err) {
      setError(err?.message || "Không thể truy vấn dữ liệu.");
    } finally {
      setQuerying(false);
    }
  };

  const handlePublishedSnapshot = async (snapshotId) => {
    setSelectedPublishedId(snapshotId);
    setQuerying(true);
    setError(null);
    stopPoll();
    try {
      const res = await getForestClassificationSnapshot(snapshotId);
      const payload = res?.data ?? res;
      setData(payload);
      activatePublishedLayer(
        payload?.snapshot ||
          publishedHistory.find((item) => String(item.id) === snapshotId),
      );
      if (payload?.snapshot) {
        setYear(String(payload.snapshot.year));
        setMonth(String(payload.snapshot.month));
      }
    } catch (err) {
      setError(err?.message || "Không thể tải phiên bản đã xuất bản.");
    } finally {
      setQuerying(false);
    }
  };

  const snapshot = data?.snapshot;
  const comparison = data?.comparison ?? null;
  const provinceSummary = normalizeProvinceSummary(snapshot?.provinceSummary);
  const totalHa = provinceSummary.reduce((s, c) => s + (c.area_ha ?? 0), 0);
  const totalForestHa = provinceSummary
    .filter((c) => FOREST_CLASS_IDS.includes(c.class_id))
    .reduce((s, c) => s + (c.area_ha ?? 0), 0);

  const isComputing = data?.computing;
  const isStale = data?.stale;

  useEffect(() => {
    if (!mapInstance) return;

    const syncLayers = () => {
      for (const layer of Object.values(mapLayers)) {
        ensureForestRasterLayer(mapInstance, layer);
      }

      const activeIds = new Set(Object.keys(mapLayers));
      for (const id of getForestRasterIds(mapInstance)) {
        if (!activeIds.has(id)) removeForestRasterLayer(mapInstance, id);
      }
    };

    if (mapInstance.isStyleLoaded?.()) syncLayers();
    else mapInstance.once("load", syncLayers);
    mapInstance.on("style.load", syncLayers);

    return () => {
      mapInstance.off("load", syncLayers);
      mapInstance.off("style.load", syncLayers);
    };
  }, [mapInstance, mapLayers]);

  useEffect(() => {
    return () => {
      if (!mapInstance) return;
      for (const id of getForestRasterIds(mapInstance)) {
        removeForestRasterLayer(mapInstance, id);
      }
    };
  }, [mapInstance]);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TreePine className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-foreground">
            Phân loại rừng
          </h2>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Phân loại 11 lớp phủ rừng hàng tháng từ Landsat/Sentinel-2 sử dụng
          Random Forest (GEE).
        </p>
      </div>

      {/* Period selector */}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Năm</label>
          <Select value={year} onValueChange={setYear} disabled={querying}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Tháng</label>
          <Select value={month} onValueChange={setMonth} disabled={querying}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((label, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          variant="gradient-primary"
          onClick={handleQuery}
          disabled={querying || loading}
          className="h-8 px-3"
        >
          {querying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CalendarDays className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={load}
          disabled={loading || querying}
          className="h-8 px-3"
          title="Tải mới nhất"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          Lịch sử đã publish, chọn để thêm lớp GeoServer
        </label>
        <Select
          value={selectedPublishedId}
          onValueChange={handlePublishedSnapshot}
          disabled={querying || publishedHistory.length === 0}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue
              placeholder={
                publishedHistory.length > 0
                  ? "Chọn phiên bản GeoServer"
                  : "Chưa có phiên bản đã publish"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {publishedHistory.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                Tháng {item.month}/{item.year} · {formatDateTime(item.published_at)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(mapLayers).length > 0 && (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Lớp phân loại trên bản đồ
            </span>
            <Badge variant="outline">{Object.keys(mapLayers).length}</Badge>
          </div>
          <div className="max-h-48 divide-y divide-border overflow-y-auto">
            {Object.values(mapLayers).map((layer) => (
              <div key={layer.id} className="space-y-2 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm border border-border"
                    style={{ backgroundColor: CLASS_PALETTE[4] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {layer.label}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      {layer.geoserverLayer}
                    </p>
                  </div>
                  {layer.downloadUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDownloadLayer(layer)}
                      disabled={downloadingLayerId === layer.id}
                      title={
                        layer.downloadSource === "geoserver"
                          ? `Tải GeoTIFF từ GeoServer (${layer.downloadFilename})`
                          : `Tải GeoTIFF từ Earth Engine — TTL ~24h (${layer.downloadFilename})`
                      }
                      aria-label="Tải GeoTIFF"
                    >
                      {downloadingLayerId === layer.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download
                          className={`h-3.5 w-3.5 ${
                            layer.downloadSource === "geoserver"
                              ? "text-primary"
                              : "text-amber-600"
                          }`}
                        />
                      )}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant={layer.visible ? "soft-primary" : "outline"}
                    size="icon-xs"
                    onClick={() =>
                      setMapLayers((current) => ({
                        ...current,
                        [layer.id]: {
                          ...current[layer.id],
                          visible: !current[layer.id].visible,
                        },
                      }))
                    }
                    title={layer.visible ? "Ẩn lớp" : "Hiện lớp"}
                  >
                    {layer.visible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() =>
                      setMapLayers((current) => {
                        const next = { ...current };
                        delete next[layer.id];
                        return next;
                      })
                    }
                    title="Gỡ lớp khỏi bản đồ"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[Math.round(layer.opacity * 100)]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={([value]) =>
                      setMapLayers((current) => ({
                        ...current,
                        [layer.id]: {
                          ...current[layer.id],
                          opacity: value / 100,
                        },
                      }))
                    }
                    aria-label={`Độ trong suốt ${layer.label}`}
                  />
                  <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Loading skeleton */}
      {(loading || querying) && !data && (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Computing banner */}
      {isComputing && snapshot && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>
            Đang phân tích {MONTHS[(snapshot.month ?? 1) - 1]} {snapshot.year} —
            tự động cập nhật…
          </span>
        </div>
      )}

      {/* Stale banner */}
      {isStale && !isComputing && (
        <div className="flex items-center gap-2 rounded-lg border border-muted/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
          <span>Dữ liệu có thể chưa cập nhật cho kỳ hiện tại.</span>
        </div>
      )}

      {/* Snapshot summary card */}
      {snapshot && (
        <Card className="gap-3 py-3">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {MONTHS[(snapshot.month ?? 1) - 1]} {snapshot.year}
              </span>
              <StatusBadge status={snapshot.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground">Tổng diện tích rừng</p>
                <p className="mt-0.5 font-semibold text-green-600">
                  {formatArea(totalForestHa)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground">Độ chính xác OOB</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {snapshot.oobAccuracy != null
                    ? `${(snapshot.oobAccuracy * 100).toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </div>
            {snapshot.computedAt && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Phân tích: {formatDateTime(snapshot.computedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {comparison && <ComparisonCard comparison={comparison} />}

      {/* Legend + area table */}
      {provinceSummary.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Phân bố diện tích
            </h3>
          </div>
          <ScrollArea className="flex-1 rounded-xl border border-border bg-card/40">
            <div className="space-y-2 p-3">
              {/* Header row */}
              <div className="flex items-center gap-2 border-b border-border pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="h-3 w-3 shrink-0" />
                <span className="flex-1">Lớp phủ</span>
                <span className="shrink-0">%</span>
                <span className="w-20 shrink-0 text-right">Diện tích</span>
              </div>
              {provinceSummary
                .slice()
                .sort((a, b) => (b.area_ha ?? 0) - (a.area_ha ?? 0))
                .map((cls) => (
                  <ClassRow
                    key={cls.class_id}
                    classId={cls.class_id}
                    name={
                      cls.class_name ??
                      CLASS_NAMES[cls.class_id] ??
                      `Lớp ${cls.class_id}`
                    }
                    areaHa={cls.area_ha ?? 0}
                    totalHa={totalHa}
                  />
                ))}
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-xs font-semibold text-foreground">
                <span className="h-3 w-3 shrink-0" />
                <span className="flex-1">Tổng cộng</span>
                <span className="shrink-0">100%</span>
                <span className="w-20 shrink-0 text-right">
                  {formatArea(totalHa)}
                </span>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Empty state */}
      {!loading && !querying && !snapshot && !error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <TreePine className="h-10 w-10 opacity-30" />
          <p className="text-sm">Chưa có dữ liệu phân loại</p>
          <p className="text-xs">
            Chọn năm/tháng và nhấn nút lịch để truy vấn.
          </p>
        </div>
      )}
    </div>
  );
}

export default ForestClassification;
