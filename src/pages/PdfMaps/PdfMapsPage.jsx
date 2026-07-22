import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Layers,
  Map,
  Ruler,
  Search,
} from "lucide-react";
import LoadingInline from "@/components/common/LoadingInline";
import PaginationCustom from "@/components/common/PaginationCustom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, praseLink } from "@/lib/utils";
import NewsLayout from "@/layout/NewsLayout";
import {
  PDF_MAP_THEME_LABELS,
  useGetPdfMapsQuery,
} from "@/services/pdfMapsService";
import { DocumentSkeletonCard } from "@/pages/Documents/Skeleton";

const ALL_THEMES = "all";
const ANY_YEAR = "all";
const YEAR_SELECT_CONTENT_CLASS = "max-h-64 overflow-y-auto sm:max-h-80";

function getThemeLabel(themeCode) {
  return PDF_MAP_THEME_LABELS[themeCode] || "Bản đồ khác";
}

function isImageFile(item) {
  const mimeType = item?.mimeType || "";
  const fileUrl = item?.fileUrl || "";
  return (
    mimeType.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(fileUrl)
  );
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 1990 }, (_, index) =>
    String(currentYear - index),
  );
}

export default function PdfMapsPage() {
  const navigate = useNavigate();
  const yearOptions = useMemo(() => buildYearOptions(), []);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 6,
    theme: ALL_THEMES,
    yearFrom: ANY_YEAR,
    yearTo: ANY_YEAR,
    sortBy: "year",
    sortOrder: "DESC",
    lang: "vi",
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const queryParams = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      lang: filters.lang,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      q: debouncedSearch,
      theme: filters.theme === ALL_THEMES ? undefined : filters.theme,
      yearFrom:
        filters.yearFrom === ANY_YEAR ? undefined : Number(filters.yearFrom),
      yearTo: filters.yearTo === ANY_YEAR ? undefined : Number(filters.yearTo),
    }),
    [debouncedSearch, filters],
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useGetPdfMapsQuery(queryParams);

  const pdfMaps = Array.isArray(data?.data?.items) ? data.data.items : [];

  const pagination = data?.metadata || {};
  const total = Number(pagination.total || pdfMaps.length);
  const totalPages =
    Number(pagination.totalPages) ||
    Math.max(1, Math.ceil(total / filters.limit));

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (value) => {
    const [sortBy, sortOrder] = value.split("-");
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  const handleOpenDetail = (item) => {
    navigate(`/pdf-maps/${item.id}`, { state: { pdfMap: item } });
  };

  return (
    <NewsLayout>
      <main className="container mx-auto px-4 py-6 md:py-8">
        <section className="mb-6 md:mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
                Bản đồ PDF
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
                Tra cứu các sản phẩm bản đồ PDF công khai theo chủ đề, năm, tỷ
                lệ và khu vực của tỉnh Kon Tum.
              </p>
            </div>
          </div>
        </section>

        <section
          className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center"
          aria-label="Bộ lọc bản đồ PDF"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm bản đồ"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setFilters((prev) => ({ ...prev, page: 1 }));
              }}
              className="pl-10"
            />
          </div>

          <div className="w-full lg:w-[180px]">
            <Select
              value={filters.theme}
              onValueChange={(value) => updateFilter("theme", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chủ đề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_THEMES}>Tất cả chủ đề</SelectItem>
                <SelectItem value="lop_phu_nhiet">Lớp phủ nhiệt</SelectItem>
                <SelectItem value="chay_rung">Cảnh báo cháy rừng</SelectItem>
                <SelectItem value="lop_phu_rung">Lớp phủ rừng</SelectItem>
                <SelectItem value="khac">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full lg:w-[130px]">
            <Select
              value={filters.yearFrom}
              onValueChange={(value) => updateFilter("yearFrom", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Từ năm" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className={YEAR_SELECT_CONTENT_CLASS}
              >
                <SelectItem value={ANY_YEAR}>Từ năm</SelectItem>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full lg:w-[130px]">
            <Select
              value={filters.yearTo}
              onValueChange={(value) => updateFilter("yearTo", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Đến năm" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className={YEAR_SELECT_CONTENT_CLASS}
              >
                <SelectItem value={ANY_YEAR}>Đến năm</SelectItem>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full lg:w-[170px]">
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="year-DESC">Năm mới nhất</SelectItem>
                <SelectItem value="year-ASC">Năm cũ nhất</SelectItem>
                <SelectItem value="created_at-DESC">Mới cập nhật</SelectItem>
                <SelectItem value="title-ASC">Tiêu đề A-Z</SelectItem>
                <SelectItem value="theme_code-ASC">Chủ đề</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full lg:w-[120px]">
            <Select
              value={String(filters.limit)}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  limit: Number(value),
                  page: 1,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Hiển thị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 mục</SelectItem>
                <SelectItem value="12">12 mục</SelectItem>
                <SelectItem value="24">24 mục</SelectItem>
                <SelectItem value="50">50 mục</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: filters.limit }).map((_, index) => (
              <DocumentSkeletonCard key={index} />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-card-foreground">
            <Map className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 font-medium">
              Không thể tải danh sách bản đồ PDF.
            </p>
            <Button variant="soft-warning" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {pdfMaps.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-card-foreground">
                <Map className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="font-medium">Không tìm thấy bản đồ phù hợp.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thử thay đổi từ khóa, chủ đề hoặc khoảng năm.
                </p>
              </div>
            ) : (
              <>
                <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {isFetching && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm">
                      <LoadingInline size="large" />
                    </div>
                  )}

                  {pdfMaps.map((item) => {
                    const fileUrl = item.fileUrl;
                    const parsedFileUrl = fileUrl ? praseLink(fileUrl) : "";
                    const thumbnailUrl = item.thumbnailUrl
                      ? praseLink(item.thumbnailUrl)
                      : "";
                    const previewUrl =
                      thumbnailUrl || (isImageFile(item) ? parsedFileUrl : "");

                    return (
                      <Card
                        key={item.id}
                        variant="interactive"
                        role="button"
                        tabIndex={0}
                        className="group cursor-pointer overflow-hidden py-0"
                        onClick={() => handleOpenDetail(item)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpenDetail(item);
                          }
                        }}
                      >
                        <div className="relative h-40 overflow-hidden border-b border-border bg-muted">
                          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                            <Badge variant="soft-info">
                              <Layers />
                              {getThemeLabel(item.themeCode)}
                            </Badge>
                            {item.year && (
                              <Badge variant="secondary">{item.year}</Badge>
                            )}
                          </div>

                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={item.title || "Bản đồ PDF"}
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-(image:--gradient-surface-map)">
                              <div className="rounded-lg border border-border bg-card/90 p-4 text-center shadow-sm">
                                <Map className="mx-auto mb-2 h-10 w-10 text-primary" />
                                <p className="text-xs font-medium text-card-foreground">
                                  Bản đồ PDF
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <CardContent className="flex flex-1 flex-col p-4">
                          <h2 className="line-clamp-2 min-h-12 text-base font-semibold leading-6 text-card-foreground transition-colors group-hover:text-primary">
                            {item.title || `Bản đồ PDF #${item.id}`}
                          </h2>
                          <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                            {item.description || "Chưa có mô tả."}
                          </p>

                          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Ruler className="h-3.5 w-3.5" />
                              <span>{item.scale || "Chưa cập nhật tỷ lệ"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Map className="h-3.5 w-3.5" />
                              <span className="truncate">
                                {item.region || "Tỉnh Kon Tum"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(item.createdAt)}
                              </span>
                              <span className="truncate">
                                {item.fileName || "PDF"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button
                              type="button"
                              variant="soft-primary"
                              size="sm"
                              className="flex-1"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenDetail(item);
                              }}
                            >
                              <Eye />
                              Chi tiết
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!parsedFileUrl}
                              aria-label="Mở bản đồ PDF"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (parsedFileUrl) {
                                  window.open(
                                    parsedFileUrl,
                                    "_blank",
                                    "noopener,noreferrer",
                                  );
                                }
                              }}
                            >
                              <Download />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <PaginationCustom
                      currentPage={filters.page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </NewsLayout>
  );
}
