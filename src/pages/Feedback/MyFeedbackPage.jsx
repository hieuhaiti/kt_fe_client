import { useMemo, useState } from "react";
import {
  Calendar,
  ExternalLink,
  FileImage,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import LoadingInline from "@/components/common/LoadingInline";
import PaginationCustom from "@/components/common/PaginationCustom";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import NewsLayout from "@/layout/NewsLayout";
import { formatDateTime, praseLink } from "@/lib/utils";
import {
  useGetFeedbackDetailQuery,
  useGetMyFeedbackQuery,
} from "@/services/feedbackService";
import useAuthStore from "@/stores/useAuthStore.jsx";

const ALL_VALUE = "all";

const STATUS_META = {
  new: { label: "Mới tiếp nhận", variant: "soft-info" },
  in_progress: { label: "Đang xử lý", variant: "soft-warning" },
  resolved: { label: "Đã xử lý", variant: "soft-success" },
  rejected: { label: "Từ chối", variant: "soft-destructive" },
};

const CATEGORY_LABELS = {
  chay_rung: "Cháy rừng",
  vi_pham: "Vi phạm",
  hien_trang: "Hiện trạng",
};

const PRIORITY_META = {
  low: { label: "Thấp", variant: "ghost" },
  normal: { label: "Bình thường", variant: "soft-primary" },
  high: { label: "Cao", variant: "soft-warning" },
  urgent: { label: "Khẩn cấp", variant: "destructive" },
};

function getStatusMeta(status) {
  return STATUS_META[status] || { label: "Chưa rõ", variant: "outline" };
}

function getPriorityMeta(priority) {
  return PRIORITY_META[priority] || PRIORITY_META.normal;
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || "Phản ánh";
}

function formatCoordinate(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("vi-VN", { maximumFractionDigits: 6 });
}

function getMediaUrls(item) {
  return Array.isArray(item?.mediaUrls) ? item.mediaUrls.filter(Boolean) : [];
}

function isImageUrl(url) {
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(String(url).split("?")[0]);
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground" />
      <p className="font-medium text-foreground">Chưa có phản ánh phù hợp.</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Thử thay đổi bộ lọc hoặc gửi phản ánh mới khi phát hiện vấn đề hiện
        trường.
      </p>
      <Button className="mt-4" onClick={onCreate}>
        <Plus />
        Gửi phản ánh
      </Button>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

function PriorityBadge({ priority }) {
  const meta = getPriorityMeta(priority);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export default function MyFeedbackPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: ALL_VALUE,
    category: ALL_VALUE,
    priority: ALL_VALUE,
  });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const queryParams = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      q: debouncedSearch,
      status: filters.status === ALL_VALUE ? undefined : filters.status,
      category: filters.category === ALL_VALUE ? undefined : filters.category,
      priority: filters.priority === ALL_VALUE ? undefined : filters.priority,
    }),
    [debouncedSearch, filters],
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useGetMyFeedbackQuery(queryParams);

  const selectedFeedbackId = selectedFeedback?.id;
  const { data: detailData, isFetching: isFetchingDetail } =
    useGetFeedbackDetailQuery(selectedFeedbackId, {
      enabled: Boolean(selectedFeedbackId),
    });

  const feedbackItems = Array.isArray(data?.data?.items) ? data.data.items : [];
  const pagination = data?.metadata || {};
  const total = Number(pagination.total || feedbackItems.length);
  const totalPages =
    Number(pagination.totalPages) ||
    Math.max(1, Math.ceil(total / filters.limit));
  const detail = detailData?.data || selectedFeedback;
  const detailMedia = getMediaUrls(detail);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <NewsLayout>
      <main className="container mx-auto px-4 py-6 md:py-8">
        <section className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
              Phản ánh của tôi
            </h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Theo dõi phản ánh hiện trường đã gửi, trạng thái xử lý và vị trí
              liên quan.
            </p>
            {!isAuthenticated && (
              <div className="mt-4 rounded-lg border border-border bg-(--info-subtle) p-3 text-sm text-(--info-subtle-foreground)">
                Bạn đang xem phản ánh gắn với trình duyệt hiện tại. Đăng nhập để
                đồng bộ phản ánh theo tài khoản.
              </div>
            )}
          </div>

          <Button onClick={() => setFormOpen(true)}>
            <Plus />
            Gửi phản ánh
          </Button>
        </section>

        <Card className="mb-4 gap-3 p-4">
          <section
            className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_150px]"
            aria-label="Bộ lọc phản ánh"
          >
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tiêu đề hoặc nội dung"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setFilters((prev) => ({ ...prev, page: 1 }));
                }}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tất cả trạng thái</SelectItem>
                <SelectItem value="new">Mới tiếp nhận</SelectItem>
                <SelectItem value="in_progress">Đang xử lý</SelectItem>
                <SelectItem value="resolved">Đã xử lý</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => updateFilter("category", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Loại phản ánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tất cả loại</SelectItem>
                <SelectItem value="chay_rung">Cháy rừng</SelectItem>
                <SelectItem value="vi_pham">Vi phạm</SelectItem>
                <SelectItem value="hien_trang">Hiện trạng</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => updateFilter("priority", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Mức ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tất cả mức</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
                <SelectItem value="normal">Bình thường</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
                <SelectItem value="urgent">Khẩn cấp</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </Card>

        <Card className="overflow-hidden p-0">
          {isLoading && (
            <div className="py-20">
              <LoadingInline position="center" size="large" />
            </div>
          )}

          {isError && (
            <div className="p-8 text-center text-card-foreground">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 font-medium">
                Không thể tải danh sách phản ánh của bạn.
              </p>
              <Button variant="soft-warning" onClick={() => refetch()}>
                <RefreshCw />
                Thử lại
              </Button>
            </div>
          )}

          {!isLoading && !isError && feedbackItems.length === 0 && (
            <EmptyState onCreate={() => setFormOpen(true)} />
          )}

          {!isLoading && !isError && feedbackItems.length > 0 && (
            <div className="relative">
              {isFetching && (
                <div className="absolute inset-0 z-10 flex items-start justify-center bg-background/70 pt-16 backdrop-blur-sm">
                  <LoadingInline size="large" />
                </div>
              )}

              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[980px] table-fixed text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="w-14 px-4 py-3">#</th>
                      <th className="w-72 px-4 py-3">Phản ánh</th>
                      <th className="w-36 px-4 py-3">Loại</th>
                      <th className="w-36 px-4 py-3 text-center">
                        Trạng thái
                      </th>
                      <th className="w-32 px-4 py-3 text-center">Ưu tiên</th>
                      <th className="w-44 px-4 py-3">Vị trí</th>
                      <th className="w-44 px-4 py-3">Ngày gửi</th>
                      <th className="w-28 px-4 py-3 text-center">Tệp</th>
                      <th className="w-28 px-4 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {feedbackItems.map((item, index) => {
                      const mediaCount = getMediaUrls(item).length;
                      return (
                        <tr
                          key={item.id}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
                          onClick={() => setSelectedFeedback(item)}
                        >
                          <td className="px-4 py-3 text-muted-foreground">
                            {(filters.page - 1) * filters.limit + index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="truncate font-medium text-foreground">
                              {item.title || `Phản ánh #${item.id}`}
                            </p>
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {item.description || "Chưa có mô tả."}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">
                              {getCategoryLabel(item.category)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <PriorityBadge priority={item.priority} />
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {formatCoordinate(item.lat)},{" "}
                              {formatCoordinate(item.lng)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDateTime(item.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">
                            {mediaCount > 0 ? `${mediaCount} tệp` : "-"}
                          </td>
                          <td
                            className="px-4 py-3 text-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="soft-primary"
                              size="sm"
                              onClick={() => setSelectedFeedback(item)}
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        {!isLoading && !isError && feedbackItems.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Tổng <span className="font-medium text-foreground">{total}</span>{" "}
              phản ánh
            </span>
            <PaginationCustom
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gửi phản ánh hiện trường</DialogTitle>
            <DialogDescription>
              Gửi phản ánh kèm tọa độ và ảnh/video hiện trường nếu có.
            </DialogDescription>
          </DialogHeader>
          <FeedbackForm
            onSuccess={() => setFormOpen(false)}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedFeedback)}
        onOpenChange={(open) => {
          if (!open) setSelectedFeedback(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detail?.title || `Phản ánh #${detail?.id || ""}`}
            </DialogTitle>
            <DialogDescription>
              {isFetchingDetail
                ? "Đang tải chi tiết..."
                : "Thông tin phản ánh và trạng thái xử lý hiện tại."}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={detail.status} />
                <PriorityBadge priority={detail.priority} />
                <Badge variant="outline">{getCategoryLabel(detail.category)}</Badge>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm">
                <p className="leading-6 text-card-foreground">
                  {detail.description || "Chưa có mô tả chi tiết."}
                </p>
                <div className="grid gap-2 text-muted-foreground sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(detail.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {formatCoordinate(detail.lat)}, {formatCoordinate(detail.lng)}
                  </span>
                </div>
              </div>

              {detailMedia.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    Tệp đính kèm
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {detailMedia.map((url) => {
                      const fullUrl = praseLink(url);
                      return (
                        <a
                          key={url}
                          href={fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-lg border border-border bg-card text-card-foreground outline-none transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {isImageUrl(url) ? (
                            <img
                              src={fullUrl}
                              alt="Tệp phản ánh"
                              loading="lazy"
                              className="h-36 w-full object-cover transition-transform group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                            />
                          ) : (
                            <div className="flex h-24 items-center justify-center bg-muted">
                              <FileImage className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <span className="flex items-center gap-2 p-3 text-sm font-medium">
                            <ExternalLink className="h-4 w-4" />
                            Mở tệp
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </NewsLayout>
  );
}
