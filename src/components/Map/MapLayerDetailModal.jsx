import { memo, useEffect, useMemo, useState } from "react";
import { length as turfLength } from "@turf/length";
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  Layers3,
  MapPin,
  Route,
  Ruler,
  TableProperties,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModalMapLayerStore } from "@/stores/Map/useModalMapLayerStore";
import { cn, praseLink } from "@/lib/utils";

const HIDDEN_PROPERTY_KEYS = new Set([
  "category",
  "name",
  "name_vi",
  "name_en",
  "geometry",
  "geometry_data",
  "geom",
  "the_geom",
  "bbox",
  "layer_code",
  "geoserver_layer",
]);

const IMAGE_PROPERTY_KEYS = new Set([
  "image",
  "image_url",
  "photo",
  "photo_url",
  "thumbnail",
  "thumbnail_url",
]);

const PROPERTY_LABELS = {
  id: "Mã định danh",
  objectid: "Mã đối tượng",
  fid: "Mã đối tượng",
  code: "Mã",
  name: "Tên đối tượng",
  name_vi: "Tên tiếng Việt",
  name_en: "Tên tiếng Anh",
  type: "Loại",
  status: "Trạng thái",
  description: "Mô tả",
  address: "Địa chỉ",
  phone: "Số điện thoại",
  email: "Email",
  province: "Tỉnh",
  province_name: "Tỉnh",
  district: "Huyện",
  district_name: "Huyện",
  commune: "Xã",
  commune_name: "Xã",
  area: "Diện tích",
  area_ha: "Diện tích",
  length: "Chiều dài",
  source: "Nguồn dữ liệu",
  created_at: "Ngày tạo",
  updated_at: "Cập nhật lúc",
};

const CATEGORY_LABELS = {
  giao_thong: "Giao thông",
  thuy_van: "Thủy văn",
  hanh_chinh: "Hành chính",
  lam_nghiep: "Lâm nghiệp",
  moi_truong: "Môi trường",
  ha_tang: "Hạ tầng",
};

function hexToRgba(hex, alpha = 0.12) {
  if (!hex || typeof hex !== "string") return null;
  let normalized = hex.trim().replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((character) => character + character)
      .join("");
  }
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function getDisplayName(data) {
  return (
    data?.name ||
    data?.name_vi ||
    data?.name_en ||
    data?.properties?.name ||
    data?.properties?.name_vi ||
    data?.code ||
    "Đối tượng bản đồ"
  );
}

function humanizeText(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getCategoryLabel(data) {
  const category = data?.category || data?.layer_group;
  if (!category) return "Chưa phân loại";

  return CATEGORY_LABELS[String(category).toLowerCase()] || humanizeText(category);
}

function getLayerColor(data) {
  const style = data?.default_style || {};
  const color =
    data?.color ||
    style.color ||
    style.stroke_color ||
    style.line_color ||
    style.fill_color ||
    style.stroke ||
    style.fill;

  return typeof color === "string" && color.trim() ? color.trim() : null;
}

function getGeometry(data) {
  return data?.geometry_data || data?.geometry || null;
}

function getGeometryKind(data, geometry) {
  const type = String(data?.geometry_type || geometry?.type || "").toLowerCase();
  if (type.includes("point")) return "point";
  if (type.includes("line")) return "line";
  return "unknown";
}

function getGeometryLabel(data, geometry, kind) {
  const type = String(data?.geometry_type || geometry?.type || "").toLowerCase();
  if (kind === "point") return type.includes("multi") ? "Đa điểm" : "Điểm";
  if (kind === "line") return type.includes("multi") ? "Đa tuyến" : "Đường";
  return "Đối tượng";
}

function getPointCoordinate(geometry) {
  const coordinates =
    geometry?.type === "MultiPoint"
      ? geometry.coordinates?.[0]
      : geometry?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const x = Number(coordinates[0]);
  const y = Number(coordinates[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  const isGeographic = Math.abs(x) <= 180 && Math.abs(y) <= 90;
  return {
    x,
    y,
    isGeographic,
    copyText: isGeographic
      ? `${y.toFixed(6)}, ${x.toFixed(6)}`
      : `${x.toFixed(2)}, ${y.toFixed(2)}`,
  };
}

function getLineSequences(geometry) {
  if (geometry?.type === "LineString") return [geometry.coordinates || []];
  if (geometry?.type === "MultiLineString") return geometry.coordinates || [];
  return [];
}

function calculatePlanarLength(sequences) {
  let total = 0;
  for (const coordinates of sequences) {
    for (let index = 1; index < coordinates.length; index += 1) {
      const previous = coordinates[index - 1];
      const current = coordinates[index];
      if (!Array.isArray(previous) || !Array.isArray(current)) continue;

      const deltaX = Number(current[0]) - Number(previous[0]);
      const deltaY = Number(current[1]) - Number(previous[1]);
      if (Number.isFinite(deltaX) && Number.isFinite(deltaY)) {
        total += Math.hypot(deltaX, deltaY);
      }
    }
  }
  return total / 1000;
}

function getLineStats(geometry) {
  const sequences = getLineSequences(geometry);
  if (!sequences.length) return null;

  const vertices = sequences.reduce(
    (total, coordinates) => total + coordinates.length,
    0,
  );
  const segments = sequences.reduce(
    (total, coordinates) => total + Math.max(0, coordinates.length - 1),
    0,
  );
  const coordinates = sequences.flat();
  const isGeographic = coordinates.every(
    (coordinate) =>
      Array.isArray(coordinate) &&
      Number.isFinite(Number(coordinate[0])) &&
      Number.isFinite(Number(coordinate[1])) &&
      Math.abs(Number(coordinate[0])) <= 180 &&
      Math.abs(Number(coordinate[1])) <= 90,
  );

  let lengthKm = null;
  try {
    lengthKm = isGeographic
      ? turfLength(
          { type: "Feature", properties: {}, geometry },
          { units: "kilometers" },
        )
      : calculatePlanarLength(sequences);
  } catch {
    lengthKm = null;
  }

  return {
    lengthKm: Number.isFinite(lengthKm) ? lengthKm : null,
    segments,
    vertices,
  };
}

function formatLength(lengthKm) {
  if (!Number.isFinite(lengthKm)) return "Chưa xác định";
  if (lengthKm < 1) {
    return `${(lengthKm * 1000).toLocaleString("vi-VN", {
      maximumFractionDigits: 0,
    })} m`;
  }
  return `${lengthKm.toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })} km`;
}

function getPropertyLabel(key) {
  const normalizedKey = String(key).toLowerCase();
  return PROPERTY_LABELS[normalizedKey] || humanizeText(key);
}

function isDateValue(key, value) {
  if (typeof value !== "string") return false;
  const normalizedKey = String(key).toLowerCase();
  return (
    /(_at|_date|date|time)$/.test(normalizedKey) &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  );
}

function formatPropertyValue(key, value) {
  if (value == null || value === "") return "Chưa có dữ liệu";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "number") {
    const normalizedKey = String(key).toLowerCase();
    if (normalizedKey === "id" || normalizedKey.endsWith("_id")) {
      return String(value);
    }
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
  }
  if (isDateValue(key, value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: value.includes("T") ? "short" : undefined,
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
    }
  }
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isExternalUrl(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("https://") || value.startsWith("http://"))
  );
}

function getImageUrl(properties) {
  const entry = Object.entries(properties || {}).find(
    ([key, value]) =>
      IMAGE_PROPERTY_KEYS.has(String(key).toLowerCase()) &&
      typeof value === "string" &&
      value.trim(),
  );
  return entry ? praseLink(entry[1]) : null;
}

function CopyCoordinateButton({ value }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      aria-label={copied ? "Đã sao chép tọa độ" : "Sao chép tọa độ"}
      title={copied ? "Đã sao chép" : "Sao chép tọa độ"}
      className="shrink-0"
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

function SummaryMetric({ icon, label, value, detail }) {
  const MetricIcon = icon;

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MetricIcon className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <p className="mt-1.5 break-words text-base font-semibold text-foreground">
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}

function GeometrySummary({ geometry, kind }) {
  const point = kind === "point" ? getPointCoordinate(geometry) : null;
  const line = kind === "line" ? getLineStats(geometry) : null;

  if (point) {
    const precision = point.isGeographic ? 6 : 2;
    const coordinateItems = point.isGeographic
      ? [
          { label: "Vĩ độ", value: point.y },
          { label: "Kinh độ", value: point.x },
        ]
      : [
          { label: "Tọa độ X", value: point.x },
          { label: "Tọa độ Y", value: point.y },
        ];

    return (
      <section
        aria-label="Tọa độ đối tượng"
        className="rounded-xl border border-primary/20 bg-(--primary-subtle) p-3.5"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-(--primary-subtle-foreground)">
            <MapPin className="h-4 w-4" />
            Vị trí đối tượng
          </div>
          <CopyCoordinateButton key={point.copyText} value={point.copyText} />
        </div>
        <dl className="grid grid-cols-2 gap-2">
          {coordinateItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg bg-card/80 px-3 py-2"
            >
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold text-foreground">
                {item.value.toFixed(precision)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  if (line) {
    return (
      <section aria-label="Thông số đường" className="grid grid-cols-3 gap-2.5">
        <SummaryMetric
          icon={Ruler}
          label="Chiều dài"
          value={formatLength(line.lengthKm)}
          detail="Ước tính theo hình học"
        />
        <SummaryMetric
          icon={Route}
          label="Số đoạn"
          value={line.segments.toLocaleString("vi-VN")}
        />
        <SummaryMetric
          icon={MapPin}
          label="Số đỉnh"
          value={line.vertices.toLocaleString("vi-VN")}
        />
      </section>
    );
  }

  return null;
}

function PropertyValue({ propertyKey, value }) {
  if (isExternalUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 break-all font-medium text-info underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Mở liên kết
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    );
  }

  return (
    <span
      className={cn(
        "break-words text-foreground",
        (value == null || value === "") && "text-muted-foreground italic",
      )}
    >
      {formatPropertyValue(propertyKey, value)}
    </span>
  );
}

function PropertyList({ entries }) {
  if (!entries.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <Info className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">
          Chưa có thông tin chi tiết
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Lớp dữ liệu chưa cung cấp thêm thuộc tính cho đối tượng này.
        </p>
      </div>
    );
  }

  return (
    <dl className="overflow-hidden rounded-xl border border-border bg-card">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="grid gap-1.5 border-b border-border px-3.5 py-3 last:border-b-0 sm:grid-cols-[minmax(8.5rem,0.75fr)_minmax(0,1.25fr)] sm:gap-4"
        >
          <dt className="text-xs font-medium text-muted-foreground sm:text-sm">
            {getPropertyLabel(key)}
          </dt>
          <dd className="min-w-0 text-sm">
            <PropertyValue propertyKey={key} value={value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function MapLayerDetailModal() {
  const isOpen = useModalMapLayerStore((state) => state.isOpen);
  const mapLayerData = useModalMapLayerStore((state) => state.mapLayerData);
  const closeModal = useModalMapLayerStore((state) => state.closeModal);

  const geometry = useMemo(() => getGeometry(mapLayerData), [mapLayerData]);
  const geometryKind = useMemo(
    () => getGeometryKind(mapLayerData, geometry),
    [geometry, mapLayerData],
  );
  const geometryLabel = useMemo(
    () => getGeometryLabel(mapLayerData, geometry, geometryKind),
    [geometry, geometryKind, mapLayerData],
  );
  const properties = useMemo(
    () => mapLayerData?.properties || {},
    [mapLayerData],
  );
  const propertyEntries = useMemo(
    () =>
      Object.entries(properties).filter(([key]) => {
        const normalizedKey = String(key).toLowerCase();
        return (
          !HIDDEN_PROPERTY_KEYS.has(normalizedKey) &&
          !IMAGE_PROPERTY_KEYS.has(normalizedKey)
        );
      }),
    [properties],
  );
  const imageUrl = useMemo(() => getImageUrl(properties), [properties]);
  const categoryMeta = useMemo(() => {
    const color = getLayerColor(mapLayerData);
    return {
      label: getCategoryLabel(mapLayerData),
      color,
      colorWash: hexToRgba(color),
      iconUrl: mapLayerData?.icon_url
        ? praseLink(mapLayerData.icon_url)
        : null,
    };
  }, [mapLayerData]);

  if (!mapLayerData) return null;

  const name = getDisplayName(mapLayerData);
  const GeometryIcon = geometryKind === "line" ? Route : MapPin;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeModal();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[88dvh] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl"
      >
        <div
          className="h-1 w-full bg-primary"
          style={
            categoryMeta.color
              ? { backgroundColor: categoryMeta.color }
              : undefined
          }
        />

        <DialogHeader className="border-b border-border bg-(image:--gradient-surface-map) px-5 py-4 pr-4 text-left sm:px-6 sm:py-5">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-(--primary-subtle) text-(--primary-subtle-foreground) shadow-sm",
                categoryMeta.color && "border-transparent",
              )}
              style={
                categoryMeta.color
                  ? {
                      color: categoryMeta.color,
                      backgroundColor: categoryMeta.colorWash || undefined,
                      borderColor: categoryMeta.color,
                    }
                  : undefined
              }
            >
              {categoryMeta.iconUrl ? (
                <img
                  src={categoryMeta.iconUrl}
                  alt=""
                  className="h-6 w-6 object-contain"
                />
              ) : (
                <GeometryIcon className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="pr-1 text-lg leading-snug sm:text-xl">
                {name}
              </DialogTitle>
              <DialogDescription className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant={geometryKind === "line" ? "soft-info" : "soft-primary"}
                  className="rounded-md"
                >
                  <GeometryIcon className="h-3 w-3" />
                  {geometryLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "max-w-full rounded-md",
                    !categoryMeta.color &&
                      "border-primary/30 bg-(--primary-subtle) text-(--primary-subtle-foreground)",
                  )}
                  style={
                    categoryMeta.color
                      ? {
                          color: categoryMeta.color,
                          borderColor: categoryMeta.color,
                          backgroundColor: categoryMeta.colorWash || undefined,
                        }
                      : undefined
                  }
                >
                  <Layers3 className="h-3 w-3" />
                  <span className="truncate">{categoryMeta.label}</span>
                </Badge>
                {mapLayerData.code && (
                  <span className="text-xs text-muted-foreground">
                    Mã lớp: {mapLayerData.code}
                  </span>
                )}
              </DialogDescription>
              {mapLayerData.description && (
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">
                  {mapLayerData.description}
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={closeModal}
              aria-label="Đóng cửa sổ chi tiết"
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <div className="space-y-5">
            <GeometrySummary geometry={geometry} kind={geometryKind} />

            {imageUrl && (
              <figure className="overflow-hidden rounded-xl border border-border bg-card">
                <img
                  src={imageUrl}
                  alt={`Hình ảnh ${name}`}
                  loading="lazy"
                  className="h-48 w-full object-cover sm:h-56"
                />
                <figcaption className="border-t border-border px-3.5 py-2 text-xs text-muted-foreground">
                  Hình ảnh đối tượng
                </figcaption>
              </figure>
            )}

            <section aria-labelledby="map-layer-properties-title">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <h3
                  id="map-layer-properties-title"
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <TableProperties className="h-4 w-4 text-primary" />
                  Thông tin thuộc tính
                </h3>
                <span className="text-xs text-muted-foreground">
                  {propertyEntries.length} trường
                </span>
              </div>
              <PropertyList entries={propertyEntries} />
            </section>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3 sm:px-6">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Dữ liệu được cung cấp từ lớp bản đồ đang chọn.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeModal}
            className="ml-auto min-w-24"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(MapLayerDetailModal);
