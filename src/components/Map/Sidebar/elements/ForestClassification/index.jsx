import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  EyeOff,
  GitCompareArrows,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  TreePine,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getForestClassificationDistrictExports,
  getForestClassificationLatest,
  getForestClassificationPublishedHistory,
  getForestClassificationSnapshot,
} from "@/features/map/api/forestClassificationApi";
import { GEOSERVER_LAYER_ORDER_PRIORITY } from "@/constant/geoserverData";
import { getRasterLayerBeforeId } from "@/helper/Map/MapHelper";
import { buildWmsTileUrl } from "@/helper/Map/geoserver/wms";
import { useMapStore } from "@/stores/Map/useMapStore";

const FOREST_HISTORY_SOURCE_PREFIX = "forest-class-history-source-";
const FOREST_HISTORY_LAYER_PREFIX = "forest-class-history-layer-";
const DISTRICT_POLL_INTERVAL_MS = 10_000;
const DISTRICT_POLL_MAX_MS = 15 * 60_000;
const DISTRICT_REQUEST_TIMEOUT_MS = 30_000;

// 13-class palette (mirrors server config)
const CLASS_PALETTE = [
  "#D9D9D9",
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
  "#8C8C8C",
];
const CLASS_NAMES = [
  "Không có ảnh",
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
  "Không xác định",
];
const FOREST_CLASS_IDS = [4, 5, 6, 7, 8, 9];
const CLASS_HELP = {
  1: "Khu dân cư, đường giao thông, công trình, đất trống, bãi cát sỏi, khu khai thác và đá lộ đầu.",
  2: "Cao su, cà phê, hồ tiêu, điều, mắc ca và các loại cây ăn quả lâu năm.",
  3: "Lúa, ngô, sắn, rau màu, cây hằng năm và nương rẫy luân canh.",
  4: "Rừng chuyển tiếp có cả cây lá rộng và cây lá kim.",
  5: "Rừng lá rộng xanh quanh năm, gồm rừng khép tán, rừng phục hồi và rừng nghèo.",
  6: "Rừng lá kim tự nhiên, chủ yếu là thông ba lá ở vùng núi cao.",
  7: "Rừng lá rộng rụng lá theo mùa, gồm các mảnh rừng khộp.",
  8: "Rừng tre nứa thuần và rừng hỗn giao giữa cây gỗ với tre nứa.",
  9: "Rừng trồng, chủ yếu gồm thông ba lá, keo, bạch đàn và bời lời.",
  10: "Sông, suối, hồ tự nhiên và các hồ chứa, hồ thủy điện.",
  11: "Trảng cỏ, cây bụi thấp và đất khoanh nuôi tái sinh chưa thành rừng.",
};

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

function formatArea(ha) {
  if (ha == null) return "—";
  // Từ 100 ha trở lên đổi sang km² (1 km² = 100 ha) — dễ đối chiếu với diện tích
  // hành chính tính theo km² hơn là "vạn ha".
  if (Math.abs(ha) >= 100) {
    const km2 = ha / 100;
    return `${km2.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} km²`;
  }
  return `${ha.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ha`;
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
  if (status === "exporting")
    return <Badge variant="soft-warning">Đang tạo bản đồ</Badge>;
  if (status === "cancelled") return <Badge variant="outline">Đã hủy</Badge>;
  return <Badge variant="outline">Chưa xác định</Badge>;
}

function ClassRow({ classId, name, areaHa, totalHa }) {
  const isForest = FOREST_CLASS_IDS.includes(classId);
  const pct = totalHa > 0 ? ((areaHa / totalHa) * 100).toFixed(1) : 0;
  return (
    <div className="grid grid-cols-[0.75rem_minmax(0,1fr)_4.75rem] items-center gap-2 py-1.5 text-xs @[340px]/forest:grid-cols-[0.75rem_minmax(0,1fr)_2.5rem_5rem]">
      <span
        className="h-3 w-3 shrink-0 rounded-sm border border-border/40"
        style={{ backgroundColor: CLASS_PALETTE[classId] ?? "#ccc" }}
      />
      <span
        title={CLASS_HELP[classId] || name}
        className={`flex-1 truncate ${isForest ? "font-medium text-foreground" : "text-muted-foreground"}`}
      >
        {name}
      </span>
      <span className="hidden text-right tabular-nums text-muted-foreground @[340px]/forest:block">
        {pct}%
      </span>
      <span className="text-right font-medium tabular-nums text-foreground">
        {formatArea(areaHa)}
      </span>
    </div>
  );
}

function formatPeriodLabel(period) {
  if (!period) return "—";
  return `${String(period.month).padStart(2, "0")}/${period.year}`;
}

function getPeriodOrdinal(period) {
  return Number(period?.year) * 12 + Number(period?.month) - 1;
}

function getForestAnalysisWindow(period) {
  const endExclusive = new Date(
    Date.UTC(Number(period.year), Number(period.month), 1),
  );
  const start = new Date(endExclusive);
  start.setUTCMonth(start.getUTCMonth() - 12);
  const end = new Date(endExclusive);
  end.setUTCDate(end.getUTCDate() - 1);
  const formatDate = (date) =>
    new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);

  return {
    start,
    end,
    label: `${formatDate(start)}–${formatDate(end)}`,
  };
}

function findRecommendedReferencePeriod(periods, current) {
  if (!current) return null;

  const sameMonthLastYear = periods.find(
    (item) =>
      Number(item.year) === Number(current.year) - 1 &&
      Number(item.month) === Number(current.month),
  );
  if (sameMonthLastYear) return sameMonthLastYear;

  const currentOrdinal = getPeriodOrdinal(current);
  return (
    periods
      .filter((item) => getPeriodOrdinal(item) < currentOrdinal)
      .sort(
        (first, second) => getPeriodOrdinal(second) - getPeriodOrdinal(first),
      )[0] ??
    periods.find((item) => String(item.id) !== String(current.id)) ??
    null
  );
}

function createAreaComparison(currentHa, previousHa) {
  const deltaHa = currentHa - previousHa;
  return {
    currentHa,
    previousHa,
    deltaHa,
    changePct: previousHa > 0 ? (deltaHa / previousHa) * 100 : null,
  };
}

function buildPeriodComparison(current, reference) {
  if (!current || !reference || String(current.id) === String(reference.id)) {
    return null;
  }

  const currentAreas = normalizeProvinceSummary(
    current.provinceSummary ?? current.province_summary,
  );
  const referenceAreas = normalizeProvinceSummary(
    reference.provinceSummary ?? reference.province_summary,
  );
  const currentByClass = new Map(
    currentAreas.map((item) => [
      Number(item.class_id),
      Number(item.area_ha) || 0,
    ]),
  );
  const referenceByClass = new Map(
    referenceAreas.map((item) => [
      Number(item.class_id),
      Number(item.area_ha) || 0,
    ]),
  );
  const sumArea = (byClass, classIds = CLASS_NAMES.map((_, index) => index)) =>
    classIds.reduce((sum, classId) => sum + (byClass.get(classId) || 0), 0);

  return {
    previousSnapshot: {
      id: reference.id,
      year: Number(reference.year),
      month: Number(reference.month),
    },
    province: {
      total: createAreaComparison(
        sumArea(currentByClass),
        sumArea(referenceByClass),
      ),
      forest: createAreaComparison(
        sumArea(currentByClass, FOREST_CLASS_IDS),
        sumArea(referenceByClass, FOREST_CLASS_IDS),
      ),
      classes: CLASS_NAMES.map((className, classId) => ({
        classId,
        className,
        ...createAreaComparison(
          currentByClass.get(classId) || 0,
          referenceByClass.get(classId) || 0,
        ),
      })),
    },
    districts: [],
  };
}

function ComparisonPeriodNotice({ current, reference }) {
  const [open, setOpen] = useState(false);

  if (!current || !reference) return null;

  const distance = Math.abs(
    getPeriodOrdinal(current) - getPeriodOrdinal(reference),
  );
  const overlapMonths = Math.max(0, 12 - distance);
  const sameMonth = Number(current.month) === Number(reference.month);
  const referenceIsNewer =
    getPeriodOrdinal(reference) > getPeriodOrdinal(current);
  const currentWindow = getForestAnalysisWindow(current);
  const referenceWindow = getForestAnalysisWindow(reference);
  let title = "Hai kỳ sử dụng các khoảng ảnh khác nhau";
  let summary = "Nên ưu tiên cùng tháng giữa các năm";
  let description =
    "Nên ưu tiên cùng tháng giữa các năm để hạn chế chênh lệch do mùa.";
  let tone = "border-warning/30 bg-warning/10 text-warning-foreground";

  if (referenceIsNewer) {
    title = "Kỳ đối chiếu đang mới hơn kỳ cần xem";
    summary = "Nên đổi lại thứ tự hai kỳ";
    description =
      "Nên chọn một kỳ cũ hơn để chênh lệch được trình bày đúng chiều thời gian.";
  } else if (sameMonth && distance >= 12) {
    title = "So sánh cùng mùa — phù hợp hơn";
    summary = `${formatPeriodLabel(reference)} → ${formatPeriodLabel(current)}`;
    description =
      "Hai kỳ cùng tháng giúp hạn chế khác biệt tự nhiên giữa mùa mưa, mùa khô và giai đoạn cây thay lá.";
    tone = "border-success/30 bg-success/10 text-success-foreground";
  } else if (overlapMonths > 0) {
    title = "Hai kỳ dùng chung";
    summary = `${overlapMonths}/12 tháng dữ liệu`;
    description =
      "Chênh lệch phù hợp để theo dõi xu hướng, không đại diện cho biến động chỉ xảy ra trong riêng hai tháng.";
  }

  return (
    <div className={`overflow-hidden rounded-lg border ${tone}`}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        aria-expanded={open}
        className="h-auto w-full justify-start rounded-none px-3 py-2 text-left hover:bg-muted/30"
      >
        <GitCompareArrows className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold">{title}</span>
          <span className="block truncate text-[10px] font-normal opacity-80">
            {summary}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </Button>
      {open && (
        <div className="space-y-1.5 border-t border-border/50 px-3 py-2 text-[11px]">
          <p className="leading-relaxed">{description}</p>
          <div className="space-y-0.5 text-[10px] opacity-80">
            <p>
              {formatPeriodLabel(current)}: {currentWindow.label}
            </p>
            <p>
              {formatPeriodLabel(reference)}: {referenceWindow.label}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonCard({ comparison, currentSnapshot }) {
  const previous = comparison?.previousSnapshot;
  const province = comparison?.province;
  if (!previous || !province) return null;

  const previousPeriod = formatPeriodLabel(previous);
  const currentPeriod = formatPeriodLabel(currentSnapshot);
  const topChanges = [...(province.classes || [])]
    .filter((item) => Number(item.deltaHa) !== 0)
    .sort((a, b) => Math.abs(Number(b.deltaHa)) - Math.abs(Number(a.deltaHa)))
    .slice(0, 3);

  return (
    <Card className="h-fit shrink-0 gap-3 py-3">
      <CardHeader className="px-4">
        <CardTitle className="flex min-w-0 items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-1.5">
            <GitCompareArrows className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">So sánh số liệu</span>
          </span>
          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
            {previousPeriod} → {currentPeriod}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-3 ">
        <div className="grid grid-cols-1 gap-2 text-xs @[300px]/forest:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/20 p-2.5">
            <p className="text-muted-foreground">Diện tích rừng</p>
            <p className="mt-0.5 font-semibold tabular-nums text-success">
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
                <div
                  key={item.classId}
                  className="grid grid-cols-[0.625rem_minmax(0,1fr)_auto] items-center gap-2 py-1.5 text-xs"
                >
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

function normalizeGeoServerLayer(value) {
  const layer = String(value || "").trim();
  if (
    !layer ||
    layer === "#" ||
    /^https?:\/\//i.test(layer) ||
    !/^[a-z0-9][a-z0-9_.-]*(?::[a-z0-9][a-z0-9_.-]*)?$/i.test(layer)
  ) {
    return "";
  }
  return layer;
}

function getGeoServerLayers(item) {
  const direct =
    item?.geoserverLayers ??
    item?.geoserver_layers ??
    item?.districtGeoserverLayers ??
    item?.district_geoserver_layers;
  const fromDistricts = Array.isArray(item?.districts)
    ? item.districts.map(
        (district) =>
          district?.geoserverLayer ?? district?.geoserver_layer ?? "",
      )
    : [];

  return [...(Array.isArray(direct) ? direct : []), ...fromDistricts].reduce(
    (layers, value) => {
      const layer = normalizeGeoServerLayer(value);
      if (layer && !layers.includes(layer)) layers.push(layer);
      return layers;
    },
    [],
  );
}

function normalizePublishedPeriod(item) {
  const id = item?.id != null ? String(item.id) : "";
  const year = Number(item?.year);
  const month = Number(item?.month);
  if (!id || !Number.isFinite(year) || !Number.isFinite(month)) return null;

  const geoserverLayers = getGeoServerLayers(item);
  const districtLayerCount = Number(
    item?.districtLayerCount ??
      item?.district_layer_count ??
      geoserverLayers.length,
  );
  const totalDistricts = Number(
    item?.totalDistricts ??
      item?.total_districts ??
      item?.total ??
      districtLayerCount,
  );

  return {
    ...item,
    id,
    year,
    month,
    geoserverLayers,
    districtLayerCount,
    totalDistricts,
  };
}

function mergeSnapshotWithPublishedPeriod(snapshot, publishedPeriod) {
  if (!snapshot && !publishedPeriod) return null;

  const geoserverLayers = [
    ...new Set([
      ...getGeoServerLayers(publishedPeriod),
      ...getGeoServerLayers(snapshot),
    ]),
  ];

  return {
    ...publishedPeriod,
    ...snapshot,
    geoserverLayers,
    totalDistricts:
      snapshot?.totalDistricts ??
      snapshot?.total_districts ??
      publishedPeriod?.totalDistricts ??
      publishedPeriod?.total_districts ??
      geoserverLayers.length,
  };
}

function mergePublishedPeriods(...groups) {
  const byPeriod = new Map();

  groups.flat().forEach((item) => {
    const normalized = normalizePublishedPeriod(item);
    if (!normalized) return;
    const key = `${normalized.year}-${String(normalized.month).padStart(2, "0")}`;
    const previous = byPeriod.get(key);
    if (!previous || Number(normalized.id) > Number(previous.id)) {
      byPeriod.set(key, normalized);
    } else if (normalized.id === previous.id) {
      byPeriod.set(key, {
        ...previous,
        ...normalized,
        geoserverLayers:
          normalized.geoserverLayers.length > 0
            ? normalized.geoserverLayers
            : previous?.geoserverLayers || [],
      });
    }
  });

  return [...byPeriod.values()].sort(
    (a, b) =>
      b.year - a.year || b.month - a.month || Number(b.id) - Number(a.id),
  );
}

function firstFiniteCount(values, { positive = false } = {}) {
  for (const value of values) {
    if (value == null) continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && (positive ? parsed > 0 : parsed >= 0)) {
      return Math.trunc(parsed);
    }
  }
  return null;
}

function firstBoolean(values) {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === 1 || value === "1") return true;
    if (value === "false" || value === 0 || value === "0") return false;
  }
  return null;
}

function normalizeDistrictAggregate(districtPayload) {
  const aggregate =
    districtPayload?.aggregate ?? districtPayload?.districtAggregate ?? null;
  if (!aggregate || typeof aggregate !== "object") return null;

  const rawByClass = aggregate.byClass ?? aggregate.by_class ?? {};
  const byClass = Object.fromEntries(
    Object.entries(rawByClass)
      .map(([classId, areaHa]) => [classId, Number(areaHa)])
      .filter(([, areaHa]) => Number.isFinite(areaHa)),
  );
  const totalHa = Number(aggregate.totalHa ?? aggregate.total_ha);
  const forestHa = Number(aggregate.forestHa ?? aggregate.forest_ha);

  return {
    byClass,
    totalHa: Number.isFinite(totalHa) ? totalHa : null,
    forestHa: Number.isFinite(forestHa) ? forestHa : null,
  };
}

function isValidHttpTileTemplate(value) {
  if (!value || typeof value !== "string") return false;
  try {
    const parsed = new URL(value.replace(/\{[^}]+\}/g, "0"));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function toDistrictReadiness(item, districtPayload) {
  const geoserverLayers = getGeoServerLayers(districtPayload);
  const fallbackLayers = getGeoServerLayers(item);
  const stableLayers = [...new Set([...fallbackLayers, ...geoserverLayers])];
  const districts = Array.isArray(districtPayload?.districts)
    ? districtPayload.districts
    : [];
  const expectedTotal = firstFiniteCount(
    [
      districtPayload?.expectedTotal,
      districtPayload?.expected_total,
      districtPayload?.totalDistricts,
      districtPayload?.total_districts,
      item?.totalDistricts,
      item?.total_districts,
    ],
    { positive: true },
  );
  const observedTotal = firstFiniteCount([
    districtPayload?.total,
    districtPayload?.observedTotal,
    districtPayload?.observed_total,
    districts.length || null,
    expectedTotal,
    stableLayers.length,
  ]);
  const districtCodeCount = firstFiniteCount([
    districtPayload?.districtCodeCount,
    districtPayload?.district_code_count,
    item?.districtCodeCount,
    item?.district_code_count,
    districts.length || null,
    observedTotal,
  ]);
  const reportedReady = firstFiniteCount([
    districtPayload?.readyCount,
    districtPayload?.ready_count,
    item?.readyCount,
    item?.ready_count,
    item?.districtLayerCount,
    item?.district_layer_count,
    stableLayers.length,
  ]);
  const total =
    expectedTotal ?? observedTotal ?? districtCodeCount ?? stableLayers.length;
  const ready = Math.min(
    stableLayers.length,
    reportedReady ?? stableLayers.length,
  );
  const explicitFullyPublished = firstBoolean([
    districtPayload?.fullyPublished,
    districtPayload?.fully_published,
    item?.fullyPublished,
    item?.fully_published,
  ]);
  const countsComplete =
    total > 0 &&
    stableLayers.length === total &&
    ready === total &&
    (observedTotal == null || observedTotal === total) &&
    (districtCodeCount == null || districtCodeCount === total);
  const complete =
    explicitFullyPublished == null
      ? countsComplete
      : explicitFullyPublished && countsComplete;

  return {
    snapshotId: String(
      districtPayload?.snapshotId ??
        districtPayload?.snapshot_id ??
        item?.id ??
        "",
    ),
    ready,
    total,
    expectedTotal,
    observedTotal,
    districtCodeCount,
    fullyPublished:
      explicitFullyPublished == null ? countsComplete : explicitFullyPublished,
    complete,
    aggregate: normalizeDistrictAggregate(districtPayload),
    scaleM: Number(districtPayload?.scaleM ?? districtPayload?.scale_m) || null,
    geoserverLayers: stableLayers,
    districtNames: districts
      .filter(
        (district) => district?.geoserverLayer || district?.geoserver_layer,
      )
      .map(
        (district) =>
          district?.districtName ??
          district?.district_name ??
          district?.districtCode ??
          district?.district_code,
      )
      .filter(Boolean),
  };
}

function isDistrictReadinessComplete(readiness) {
  return Boolean(readiness?.complete);
}

function toPublishedMapLayer(item, districtPayload) {
  const normalized = normalizePublishedPeriod(item);
  if (!normalized) return null;

  const readiness = toDistrictReadiness(normalized, districtPayload);
  if (readiness.geoserverLayers.length === 0) return null;

  // Các raster huyện không chồng lấn nên có thể ghép trong một nguồn WMS.
  let tileUrl = null;
  try {
    const candidate = buildWmsTileUrl({
      geoserver_layer: readiness.geoserverLayers.join(","),
    });
    if (isValidHttpTileTemplate(candidate)) tileUrl = candidate;
  } catch {
    tileUrl = null;
  }
  if (!tileUrl || !isDistrictReadinessComplete(readiness)) return null;

  return {
    id: normalized.id,
    geoserverLayers: readiness.geoserverLayers,
    tileUrl,
    label: `Phân loại rừng ${String(normalized.month).padStart(2, "0")}/${normalized.year}`,
    visible: true,
    opacity: 0.75,
    readyCount: readiness.ready,
    totalDistricts: readiness.total,
    scaleM: readiness.scaleM,
  };
}

function ensureForestRasterLayer(map, item) {
  const sourceId = `${FOREST_HISTORY_SOURCE_PREFIX}${item.id}`;
  const layerId = `${FOREST_HISTORY_LAYER_PREFIX}${item.id}`;

  const source = map.getSource(sourceId);
  if (!source) {
    map.addSource(sourceId, {
      type: "raster",
      tiles: [item.tileUrl],
      tileSize: 256,
      attribution: "Dữ liệu phân loại lớp phủ rừng",
    });
  } else if (typeof source.setTiles === "function") {
    source.setTiles([item.tileUrl]);
  }
  if (!map.getLayer(layerId)) {
    map.addLayer(
      {
        id: layerId,
        type: "raster",
        source: sourceId,
        metadata: {
          ktGeometryPriority: GEOSERVER_LAYER_ORDER_PRIORITY.RASTER,
          ktGeometryType: "raster",
          ktManagedOverlay: true,
        },
        paint: { "raster-opacity": item.opacity },
        layout: { visibility: item.visible ? "visible" : "none" },
      },
      getRasterLayerBeforeId(map, layerId),
    );
  } else {
    map.setPaintProperty(layerId, "raster-opacity", item.opacity);
    map.setLayoutProperty(
      layerId,
      "visibility",
      item.visible ? "visible" : "none",
    );
    const beforeId = getRasterLayerBeforeId(map, layerId);
    if (beforeId) map.moveLayer(layerId, beforeId);
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
  const [districtReadiness, setDistrictReadiness] = useState(null);
  const [districtAggregate, setDistrictAggregate] = useState(null);
  const [districtLayerLoading, setDistrictLayerLoading] = useState(false);
  const [districtLayerError, setDistrictLayerError] = useState(null);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [comparisonReferenceId, setComparisonReferenceId] = useState("");
  const [comparisonSnapshot, setComparisonSnapshot] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  const pollRef = useRef({
    timer: null,
    controller: null,
    snapshotId: "",
    startedAt: 0,
    failures: 0,
  });
  const fallbackRequestRef = useRef({
    requestId: 0,
    controller: null,
  });
  const publishedHistoryRef = useRef(publishedHistory);
  publishedHistoryRef.current = publishedHistory;
  const comparisonCurrentIdRef = useRef("");

  const activatePublishedLayer = useCallback((item, districtPayload) => {
    const readiness = toDistrictReadiness(item, districtPayload);
    const layer = toPublishedMapLayer(item, districtPayload);
    setDistrictReadiness(readiness);

    if (!layer || !isDistrictReadinessComplete(readiness)) {
      setMapLayers({});
      setDistrictAggregate(null);
      return readiness;
    }

    setDistrictAggregate(readiness.aggregate);
    setPublishedHistory((current) =>
      mergePublishedPeriods(current, {
        ...item,
        geoserverLayers: readiness.geoserverLayers,
        districtLayerCount: readiness.ready,
        totalDistricts: readiness.total,
      }),
    );
    setMapLayers((current) => {
      const previous = current[layer.id];
      return {
        [layer.id]: {
          ...layer,
          visible: previous?.visible ?? layer.visible,
          opacity: previous?.opacity ?? layer.opacity,
        },
      };
    });
    return readiness;
  }, []);

  const stopPoll = useCallback(() => {
    if (pollRef.current.timer) {
      clearTimeout(pollRef.current.timer);
    }
    pollRef.current.controller?.abort();
    pollRef.current = {
      timer: null,
      controller: null,
      snapshotId: "",
      startedAt: 0,
      failures: 0,
    };
  }, []);

  const cancelFallbackRequest = useCallback(() => {
    fallbackRequestRef.current.controller?.abort();
    fallbackRequestRef.current = {
      requestId: fallbackRequestRef.current.requestId + 1,
      controller: null,
    };
  }, []);

  const loadDistrictLayers = useCallback(
    async (item, { quiet = false } = {}) => {
      if (!item?.id) return null;
      if (!quiet) {
        setDistrictLayerLoading(true);
        setDistrictLayerError(null);
      }

      try {
        const res = await getForestClassificationDistrictExports(item.id);
        const payload = res?.data ?? res;
        return activatePublishedLayer(item, payload);
      } catch (err) {
        const fallback = activatePublishedLayer(item);
        if (fallback.geoserverLayers.length === 0) {
          setDistrictLayerError(
            err?.message || "Không thể tải các lớp bản đồ theo huyện.",
          );
        }
        return fallback;
      } finally {
        if (!quiet) setDistrictLayerLoading(false);
      }
    },
    [activatePublishedLayer],
  );

  const startPoll = useCallback(
    (snapshotItem) => {
      const snapshotId = snapshotItem?.id;
      if (!snapshotId) return;
      stopPoll();
      const pollKey = String(snapshotId);
      pollRef.current = {
        timer: null,
        controller: null,
        snapshotId: pollKey,
        startedAt: Date.now(),
        failures: 0,
      };

      const schedule = (delay = DISTRICT_POLL_INTERVAL_MS) => {
        if (pollRef.current.snapshotId !== pollKey) return;
        pollRef.current.timer = setTimeout(tick, delay);
      };

      const tick = async () => {
        if (pollRef.current.snapshotId !== pollKey) return;
        if (Date.now() - pollRef.current.startedAt >= DISTRICT_POLL_MAX_MS) {
          setDistrictLayerError(
            "Đã dừng kiểm tra sau 15 phút. Vui lòng tải lại để cập nhật trạng thái công bố.",
          );
          stopPoll();
          return;
        }

        const controller = new AbortController();
        pollRef.current.controller = controller;
        const remaining = Math.max(
          1,
          DISTRICT_POLL_MAX_MS - (Date.now() - pollRef.current.startedAt),
        );
        const requestTimer = setTimeout(
          () => controller.abort(),
          Math.min(DISTRICT_REQUEST_TIMEOUT_MS, remaining),
        );
        try {
          let firstRequestError = null;
          const abortOnFailure = (request) =>
            request.catch((requestError) => {
              firstRequestError ??= requestError;
              controller.abort();
              throw requestError;
            });
          const requestResults = await Promise.allSettled([
            abortOnFailure(
              getForestClassificationSnapshot(snapshotId, {
                signal: controller.signal,
              }),
            ),
            abortOnFailure(
              getForestClassificationDistrictExports(snapshotId, {
                signal: controller.signal,
              }),
            ),
          ]);
          const rejectedRequest = requestResults.find(
            (result) => result.status === "rejected",
          );
          if (rejectedRequest) {
            throw firstRequestError ?? rejectedRequest.reason;
          }
          const [snapshotRes, districtRes] = requestResults.map(
            (result) => result.value,
          );
          if (pollRef.current.snapshotId !== pollKey) return;
          const payload = snapshotRes?.data ?? snapshotRes;
          const districtPayload = districtRes?.data ?? districtRes;
          const nextSnapshot = payload?.snapshot ?? snapshotItem;
          const readiness = activatePublishedLayer(
            nextSnapshot,
            districtPayload,
          );

          if (payload?.snapshot) setData(payload);
          pollRef.current.failures = 0;

          const terminalFailure = ["failed", "cancelled"].includes(
            payload?.snapshot?.status,
          );
          const allDistrictsReady = isDistrictReadinessComplete(readiness);
          if (allDistrictsReady) {
            setSelectedPublishedId(String(nextSnapshot.id));
          }
          if (terminalFailure || (!payload?.computing && allDistrictsReady)) {
            stopPoll();
            return;
          }
          schedule();
        } catch (err) {
          if (pollRef.current.snapshotId !== pollKey) return;
          pollRef.current.failures += 1;
          if (pollRef.current.failures >= 3) {
            setDistrictLayerError(
              err?.message || "Kết nối tạm thời gián đoạn, đang thử lại.",
            );
          }
          schedule(
            Math.min(
              30_000,
              DISTRICT_POLL_INTERVAL_MS * pollRef.current.failures,
            ),
          );
        } finally {
          clearTimeout(requestTimer);
          if (pollRef.current.snapshotId === pollKey) {
            pollRef.current.controller = null;
          }
        }
      };

      schedule();
    },
    [activatePublishedLayer, stopPoll],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    stopPoll();
    setMapLayers({});
    setDistrictReadiness(null);
    setDistrictAggregate(null);
    try {
      const res = await getForestClassificationLatest();
      const payload = res?.data ?? res;
      setData(payload);
      const latestSnapshot = payload?.snapshot;
      if (latestSnapshot?.id) {
        setSelectedPublishedId(String(latestSnapshot.id));
        const readiness = await loadDistrictLayers(latestSnapshot);
        const districtsStillPublishing =
          !readiness ||
          readiness.total === 0 ||
          !isDistrictReadinessComplete(readiness);
        if (payload?.computing || districtsStillPublishing) {
          startPoll(latestSnapshot);
        }
      }
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu phân loại rừng.");
    } finally {
      setLoading(false);
    }
  }, [loadDistrictLayers, startPoll, stopPoll]);

  const loadPublishedHistory = useCallback(async () => {
    try {
      const res = await getForestClassificationPublishedHistory(1, 24);
      const items = res?.data?.data?.items ?? res?.data?.items ?? [];
      const stableItems = Array.isArray(items)
        ? items.filter((item) =>
            isDistrictReadinessComplete(toDistrictReadiness(item)),
          )
        : [];
      setPublishedHistory((current) =>
        mergePublishedPeriods(current, stableItems),
      );
    } catch {
      // `/latest` vẫn đủ để người dùng xem kỳ mới nhất khi lịch sử công khai
      // chưa được backend triển khai hoặc chưa có kỳ nào publish đủ huyện.
    }
  }, []);

  useEffect(() => {
    load();
    loadPublishedHistory();
    return () => {
      stopPoll();
      cancelFallbackRequest();
    };
  }, [cancelFallbackRequest, load, loadPublishedHistory, stopPoll]);

  useEffect(() => {
    if (!selectedPublishedId || mapLayers[selectedPublishedId]) return;
    const selected = publishedHistory.find(
      (item) => String(item.id) === selectedPublishedId,
    );
    if (!selected) return;
    const readiness = toDistrictReadiness(selected);
    if (isDistrictReadinessComplete(readiness)) {
      activatePublishedLayer(selected);
    }
  }, [
    activatePublishedLayer,
    mapLayers,
    publishedHistory,
    selectedPublishedId,
  ]);

  useEffect(() => {
    if (!selectedPublishedId || publishedHistory.length < 2) {
      setComparisonReferenceId("");
      return;
    }
    const current = publishedHistory.find(
      (item) => String(item.id) === selectedPublishedId,
    );
    const recommended = findRecommendedReferencePeriod(
      publishedHistory,
      current,
    );
    const currentPeriodChanged =
      comparisonCurrentIdRef.current !== selectedPublishedId;
    comparisonCurrentIdRef.current = selectedPublishedId;
    setComparisonReferenceId((currentReferenceId) => {
      if (currentPeriodChanged) {
        return recommended ? String(recommended.id) : "";
      }
      const currentReference = publishedHistory.find(
        (item) => String(item.id) === currentReferenceId,
      );
      if (
        currentReference &&
        current &&
        getPeriodOrdinal(currentReference) < getPeriodOrdinal(current)
      ) {
        return currentReferenceId;
      }
      return recommended ? String(recommended.id) : "";
    });
  }, [publishedHistory, selectedPublishedId]);

  useEffect(() => {
    if (!comparisonReferenceId) {
      setComparisonSnapshot(null);
      setComparisonError(null);
      return;
    }

    const controller = new AbortController();
    const referencePeriod = publishedHistoryRef.current.find(
      (item) => String(item.id) === comparisonReferenceId,
    );
    setComparisonLoading(true);
    setComparisonError(null);
    setComparisonSnapshot(null);

    getForestClassificationSnapshot(comparisonReferenceId, {
      signal: controller.signal,
    })
      .then((response) => {
        const payload = response?.data?.data ?? response?.data ?? response;
        const nextSnapshot = mergeSnapshotWithPublishedPeriod(
          payload?.snapshot,
          referencePeriod,
        );
        if (!nextSnapshot) {
          throw new Error("Không tìm thấy số liệu của kỳ đối chiếu.");
        }
        setComparisonSnapshot(nextSnapshot);
      })
      .catch((requestError) => {
        if (requestError?.name === "AbortError") return;
        setComparisonError(
          requestError?.message || "Không thể tải số liệu của kỳ đối chiếu.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setComparisonLoading(false);
      });

    return () => controller.abort();
  }, [comparisonReferenceId]);

  useEffect(() => {
    if (!publishedHistory.length) return;
    const selectedExists = publishedHistory.some(
      (item) => String(item.id) === selectedPublishedId,
    );
    if (selectedExists) return;

    const fallback = publishedHistory[0];
    stopPoll();
    cancelFallbackRequest();
    const requestId = fallbackRequestRef.current.requestId;
    const controller = new AbortController();
    fallbackRequestRef.current.controller = controller;
    setSelectedPublishedId(String(fallback.id));
    setData({
      snapshot: fallback,
      comparison: null,
      computing: false,
    });
    activatePublishedLayer(fallback);
    setQuerying(true);
    setDistrictLayerError(null);
    const requestTimer = setTimeout(
      () => controller.abort(),
      DISTRICT_REQUEST_TIMEOUT_MS,
    );

    Promise.allSettled([
      getForestClassificationSnapshot(fallback.id, {
        signal: controller.signal,
      }),
      getForestClassificationDistrictExports(fallback.id, {
        signal: controller.signal,
      }),
    ])
      .then(([snapshotResult, districtResult]) => {
        if (fallbackRequestRef.current.requestId !== requestId) return;
        const snapshotRes =
          snapshotResult.status === "fulfilled" ? snapshotResult.value : null;
        const districtRes =
          districtResult.status === "fulfilled" ? districtResult.value : null;
        const payload = snapshotRes?.data ?? snapshotRes;
        const districtPayload = districtRes?.data ?? districtRes;
        const nextSnapshot = mergeSnapshotWithPublishedPeriod(
          payload?.snapshot,
          fallback,
        );
        setData(
          payload
            ? { ...payload, snapshot: nextSnapshot }
            : {
                snapshot: nextSnapshot,
                comparison: null,
                computing: false,
              },
        );
        activatePublishedLayer(nextSnapshot, districtPayload);
      })
      .finally(() => {
        clearTimeout(requestTimer);
        if (fallbackRequestRef.current.requestId === requestId) {
          fallbackRequestRef.current.controller = null;
          setQuerying(false);
        }
      });
  }, [
    activatePublishedLayer,
    cancelFallbackRequest,
    publishedHistory,
    selectedPublishedId,
    stopPoll,
  ]);

  const handlePublishedSnapshot = async (snapshotId) => {
    cancelFallbackRequest();
    const requestId = fallbackRequestRef.current.requestId;
    const controller = new AbortController();
    fallbackRequestRef.current.controller = controller;
    setSelectedPublishedId(snapshotId);
    setQuerying(true);
    setError(null);
    setDistrictLayerError(null);
    setDistrictLayerLoading(true);
    stopPoll();
    const historyItem = publishedHistory.find(
      (item) => String(item.id) === snapshotId,
    );
    if (historyItem?.geoserverLayers?.length) {
      activatePublishedLayer(historyItem);
      setData({
        snapshot: historyItem,
        comparison: null,
        computing: false,
      });
    } else {
      setMapLayers({});
      setDistrictReadiness(null);
      setDistrictAggregate(null);
      setData(null);
    }
    const requestTimer = setTimeout(
      () => controller.abort(),
      DISTRICT_REQUEST_TIMEOUT_MS,
    );

    try {
      const [snapshotResult, districtResult] = await Promise.allSettled([
        getForestClassificationSnapshot(snapshotId, {
          signal: controller.signal,
        }),
        getForestClassificationDistrictExports(snapshotId, {
          signal: controller.signal,
        }),
      ]);
      if (fallbackRequestRef.current.requestId !== requestId) return;
      const snapshotRes =
        snapshotResult.status === "fulfilled" ? snapshotResult.value : null;
      const districtRes =
        districtResult.status === "fulfilled" ? districtResult.value : null;
      const payload = snapshotRes?.data ?? snapshotRes;
      const districtPayload = districtRes?.data ?? districtRes;

      const nextSnapshot = mergeSnapshotWithPublishedPeriod(
        payload?.snapshot,
        historyItem,
      );
      if (!nextSnapshot) {
        throw (
          snapshotResult.reason ||
          new Error("Không tìm thấy dữ liệu của kỳ đã chọn.")
        );
      }
      if (payload) setData({ ...payload, snapshot: nextSnapshot });

      const readiness = activatePublishedLayer(nextSnapshot, districtPayload);
      if (readiness.geoserverLayers.length === 0) {
        throw (
          districtResult.reason ||
          snapshotResult.reason ||
          new Error("Kỳ này chưa có bản đồ chi tiết theo huyện.")
        );
      }

      const districtsStillPublishing =
        readiness.total > 0 && readiness.ready < readiness.total;
      if (payload?.computing || districtsStillPublishing) {
        startPoll(nextSnapshot);
      }
    } catch (err) {
      setError(err?.message || "Không thể tải phiên bản đã xuất bản.");
    } finally {
      clearTimeout(requestTimer);
      if (fallbackRequestRef.current.requestId === requestId) {
        fallbackRequestRef.current.controller = null;
        setQuerying(false);
        setDistrictLayerLoading(false);
      }
    }
  };

  const snapshot = data?.snapshot;
  const comparisonReferencePeriod = publishedHistory.find(
    (item) => String(item.id) === comparisonReferenceId,
  );
  const comparison = buildPeriodComparison(snapshot, comparisonSnapshot);
  const analysisWindow = snapshot ? getForestAnalysisWindow(snapshot) : null;
  const availableReferencePeriods = snapshot
    ? publishedHistory.filter(
        (item) =>
          String(item.id) !== String(snapshot.id) &&
          getPeriodOrdinal(item) < getPeriodOrdinal(snapshot),
      )
    : [];
  const activeMapLayer = Object.values(mapLayers)[0] ?? null;
  const hasDistrictAggregateClasses =
    Object.keys(districtAggregate?.byClass ?? {}).length > 0;
  const summarySource = activeMapLayer
    ? hasDistrictAggregateClasses
      ? { byClass: districtAggregate.byClass }
      : null
    : snapshot?.provinceSummary;
  const areaSummary = normalizeProvinceSummary(summarySource);
  const summedTotalHa = areaSummary.reduce(
    (sum, item) => sum + (item.area_ha ?? 0),
    0,
  );
  const summedForestHa = areaSummary
    .filter((c) => FOREST_CLASS_IDS.includes(c.class_id))
    .reduce((s, c) => s + (c.area_ha ?? 0), 0);
  const totalHa = activeMapLayer
    ? districtAggregate
      ? (districtAggregate.totalHa ?? summedTotalHa)
      : null
    : summedTotalHa;
  const totalForestHa = activeMapLayer
    ? districtAggregate
      ? (districtAggregate.forestHa ?? summedForestHa)
      : null
    : summedForestHa;
  const forestPct =
    totalHa > 0 && totalForestHa != null
      ? (totalForestHa / totalHa) * 100
      : null;

  const isComputing = data?.computing;
  const isStale = data?.stale;
  const districtReadyCount = districtReadiness?.ready ?? 0;
  const districtTotalCount = districtReadiness?.total ?? 0;
  const allDistrictLayersReady = isDistrictReadinessComplete(districtReadiness);

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
    <div className="@container/forest flex min-h-full min-w-0 flex-col gap-3 px-1 pb-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TreePine className="h-5 w-5 shrink-0 text-success" />
            <h2 className="truncate text-base font-semibold text-foreground @[360px]/forest:text-lg">
              Phân loại lớp phủ rừng
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              load();
              loadPublishedHistory();
            }}
            disabled={loading || querying}
            title="Cập nhật dữ liệu"
            aria-label="Cập nhật dữ liệu phân loại rừng"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
        {snapshot?.computedAt && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground @[360px]/forest:text-xs">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              Ngày phân tích: {formatDateTime(snapshot.computedAt)}
            </span>
          </p>
        )}
      </div>

      <div className="h-fit shrink-0 rounded-lg border border-info/30 bg-info/10 text-[11px] leading-5 text-info-foreground">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setInfoExpanded((current) => !current)}
          aria-expanded={infoExpanded}
          className="flex h-auto w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold text-info-foreground hover:bg-info/10"
        >
          <span className="flex items-center gap-1.5 text-foreground">
            <Info className="h-3.5 w-3.5" />
            Thông tin dữ liệu
          </span>
          <span className="text-[10px] font-normal">
            {infoExpanded ? "Ẩn" : "Xem"}
          </span>
        </Button>
        {infoExpanded && (
          <ul className="text-foreground list-disc space-y-1 border-t border-info/20 px-3 pt-2 pb-3 pl-7">
            <li>
              <b>Ý nghĩa kỳ dữ liệu</b>: tháng được chọn là thời điểm kết quả
              được cập nhật đến, không phải bản đồ chỉ dùng ảnh của riêng tháng
              đó.
            </li>
            {snapshot && analysisWindow && (
              <li>
                <b>Khoảng ảnh sử dụng</b>: {analysisWindow.label}. Khoảng 12
                tháng giúp quan sát đủ mùa xanh, mùa khô và giai đoạn cây thay
                lá, đồng thời bổ sung những nơi bị mây che.
              </li>
            )}
            <li>
              <b>Thông tin gần nhất</b>: ba tháng cuối kỳ được dùng để phản ánh
              tình trạng mới hơn.
            </li>
            <li>
              <b>Độ chi tiết</b>: mỗi điểm trên bản đồ đại diện cho khu vực
              khoảng {districtReadiness?.scaleM ?? 150} ×{" "}
              {districtReadiness?.scaleM ?? 150} m. Ranh giới và diện tích có
              thể có sai số.
            </li>
            <li>
              <b>Khi so sánh</b>: nên ưu tiên cùng tháng giữa các năm. Hai tháng
              liền nhau dùng chung phần lớn ảnh nên chỉ phù hợp theo dõi xu
              hướng.
            </li>
          </ul>
        )}
      </div>

      <div className="h-fit shrink-0 space-y-1">
        <label className="text-xs text-muted-foreground">
          Kết quả cập nhật đến
        </label>
        <Select
          value={selectedPublishedId}
          onValueChange={handlePublishedSnapshot}
          disabled={querying || publishedHistory.length === 0}
        >
          <SelectTrigger className="h-8 w-full min-w-0 text-xs">
            <SelectValue
              placeholder={
                publishedHistory.length > 0
                  ? "Chọn tháng cần xem"
                  : "Chưa có dữ liệu lịch sử"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {publishedHistory.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                Tháng {String(item.month).padStart(2, "0")}/{item.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {snapshot && (
        <div className="h-fit shrink-0 space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Kỳ đối chiếu số liệu
            </label>
            <p className="text-[10px] leading-4 text-muted-foreground">
              Bản đồ vẫn hiển thị kỳ đang xem. Chọn một kỳ cũ hơn để đối chiếu
              diện tích.
            </p>
          </div>
          <Select
            value={comparisonReferenceId}
            onValueChange={setComparisonReferenceId}
            disabled={
              querying ||
              comparisonLoading ||
              availableReferencePeriods.length === 0
            }
          >
            <SelectTrigger className="h-8 w-full min-w-0 text-xs">
              <SelectValue
                placeholder={
                  availableReferencePeriods.length > 0
                    ? "Chọn kỳ đối chiếu"
                    : "Chưa có kỳ cũ hơn"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableReferencePeriods.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  Tháng {String(item.month).padStart(2, "0")}/{item.year}
                  {Number(item.month) === Number(snapshot.month) &&
                  Number(item.year) === Number(snapshot.year) - 1
                    ? " · cùng mùa"
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ComparisonPeriodNotice
            current={snapshot}
            reference={comparisonReferencePeriod}
          />
          {comparisonLoading && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tải số liệu đối chiếu...
            </p>
          )}
          {comparisonError && (
            <p className="text-[11px] text-destructive">{comparisonError}</p>
          )}
        </div>
      )}

      {snapshot && (
        <div className="h-fit shrink-0 overflow-hidden rounded-lg border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Bản đồ chi tiết theo huyện
            </span>
            {districtLayerLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  allDistrictLayersReady
                    ? "bg-success"
                    : districtLayerError
                      ? "bg-destructive"
                      : "bg-warning"
                }`}
              ></span>
            )}
          </div>
          {activeMapLayer ? (
            <div className="divide-y divide-border">
              <div key={activeMapLayer.id} className="space-y-2 px-3 py-2">
                <div className="grid grid-cols-[0.75rem_minmax(0,1fr)_auto] items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm border border-border"
                    style={{ backgroundColor: CLASS_PALETTE[5] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {activeMapLayer.label}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      Đã công bố
                      {activeMapLayer.scaleM
                        ? ` · độ phân giải ${activeMapLayer.scaleM}m`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant={
                        activeMapLayer.visible ? "soft-primary" : "outline"
                      }
                      size="icon-xs"
                      onClick={() =>
                        setMapLayers((current) => ({
                          ...current,
                          [activeMapLayer.id]: {
                            ...current[activeMapLayer.id],
                            visible: !current[activeMapLayer.id].visible,
                          },
                        }))
                      }
                      title={activeMapLayer.visible ? "Ẩn lớp" : "Hiện lớp"}
                    >
                      {activeMapLayer.visible ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[Math.round(activeMapLayer.opacity * 100)]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={([value]) =>
                      setMapLayers((current) => ({
                        ...current,
                        [activeMapLayer.id]: {
                          ...current[activeMapLayer.id],
                          opacity: value / 100,
                        },
                      }))
                    }
                    aria-label={`Độ trong suốt ${activeMapLayer.label}`}
                  />
                  <span className="w-8 text-right text-[10px] tabular-nums text-muted-foreground">
                    {Math.round(activeMapLayer.opacity * 100)}%
                  </span>
                </div>
                {!allDistrictLayersReady && (
                  <p className="text-[10px] leading-4 text-warning-foreground">
                    Đang hiển thị {districtReadyCount}/{districtTotalCount}{" "}
                    huyện đã sẵn sàng. Bản đồ sẽ tự cập nhật khi xử lý xong.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              {districtLayerLoading
                ? "Đang kiểm tra bản đồ chi tiết theo huyện…"
                : districtLayerError ||
                  "Kỳ này chưa có bản đồ chi tiết theo huyện để hiển thị."}
            </div>
          )}
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
        <Card className="h-fit shrink-0 gap-3 py-3">
          <CardHeader className="px-4">
            <CardTitle className="flex min-w-0 items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Cập nhật đến {MONTHS[(snapshot.month ?? 1) - 1]} {snapshot.year}
              </span>
              <StatusBadge status={snapshot.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground">Tổng diện tích rừng</p>
                <p className="mt-0.5 font-semibold text-success">
                  {formatArea(totalForestHa)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground">Tỷ lệ diện tích rừng</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {forestPct != null ? `${forestPct.toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {comparison && (
        <ComparisonCard comparison={comparison} currentSnapshot={snapshot} />
      )}

      {/* Legend + area table */}
      {areaSummary.length > 0 && (
        <Card className="h-fit shrink-0 gap-3 py-3">
          <CardHeader className="px-4">
            <CardTitle className="flex min-w-0 items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <BarChart3 className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Phân bố diện tích</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 px-3 py-2.5 @[360px]/forest:px-4">
              {/* Header row */}
              <div className="sticky top-0 z-10 grid grid-cols-[0.75rem_minmax(0,1fr)_4.75rem] items-center gap-2 border-b border-border bg-card/95 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur @[340px]/forest:grid-cols-[0.75rem_minmax(0,1fr)_2.5rem_5rem]">
                <span className="h-3 w-3 shrink-0" />
                <span className="truncate">Lớp phủ</span>
                <span className="hidden text-right @[340px]/forest:block">
                  %
                </span>
                <span className="text-right">Diện tích</span>
              </div>
              {areaSummary
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
              <div className="mt-2 grid grid-cols-[0.75rem_minmax(0,1fr)_4.75rem] items-center gap-2 border-t border-border pt-2 text-xs font-semibold text-foreground @[340px]/forest:grid-cols-[0.75rem_minmax(0,1fr)_2.5rem_5rem]">
                <span className="h-3 w-3 shrink-0" />
                <span className="truncate">Tổng cộng</span>
                <span className="hidden text-right tabular-nums @[340px]/forest:block">
                  100%
                </span>
                <span className="text-right tabular-nums">
                  {formatArea(totalHa)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !querying && !snapshot && !error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <TreePine className="h-10 w-10 opacity-30" />
          <p className="text-sm">Chưa có dữ liệu phân loại</p>
          <p className="text-xs">
            Chọn kỳ dữ liệu ở phía trên để xem lại bản đồ.
          </p>
        </div>
      )}
    </div>
  );
}

export default ForestClassification;
