import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  TreePine,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  getForestClassificationSnapshot,
  queryForestClassification,
} from "@/features/map/api/forestClassificationApi";

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
  if (ha >= 10000) return `${(ha / 10000).toFixed(1)} vạn ha`;
  return `${ha.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ha`;
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

export function ForestClassification() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState(null);

  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  const pollRef = useRef(null);

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPoll = (snapshotId) => {
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
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    stopPoll();
    try {
      const res = await getForestClassificationLatest();
      const payload = res?.data ?? res;
      setData(payload);
      if (payload?.computing && payload?.snapshot?.id) {
        startPoll(payload.snapshot.id);
      }
    } catch (err) {
      setError(err?.message || "Không thể tải dữ liệu phân loại rừng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return stopPoll;
  }, []);

  const handleQuery = async () => {
    if (!year || !month) return;
    setQuerying(true);
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

  const snapshot = data?.snapshot;
  const provinceSummary = snapshot?.provinceSummary ?? [];
  const totalHa = provinceSummary.reduce((s, c) => s + (c.area_ha ?? 0), 0);
  const totalForestHa = provinceSummary
    .filter((c) => FOREST_CLASS_IDS.includes(c.class_id))
    .reduce((s, c) => s + (c.area_ha ?? 0), 0);

  const isComputing = data?.computing;
  const isStale = data?.stale;

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
