import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Search,
  Calendar,
  User,
  FileImage,
  Clock3,
} from "lucide-react";
import LoadingInline from "@/components/common/LoadingInline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PaginationCustom from "@/components/common/PaginationCustom";
import { useGetAllNewsQuery } from "@/services/newsService";
import { useDebounce } from "@/hooks/useDebounce";
import NewsLayout from "../../layout/NewsLayout";
import { cn, formatDate, praseLink } from "../../lib/utils";
import { SkeletonCard } from "./Skeleton";

export default function NewsPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    status: "published",
    sortBy: "published_at",
    sortOrder: "DESC",
  });

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Fetch news data
  const { data, isLoading, isError, isFetching } = useGetAllNewsQuery({
    ...filters,
    q: debouncedSearch,
  });

  const newsData = Array.isArray(data?.data?.items) ? data.data.items : [];
  const paginationFromApi = data?.metadata || null;
  const total = paginationFromApi?.total ?? newsData.length;
  const totalPages =
    paginationFromApi?.totalPages ??
    Math.max(1, Math.ceil(total / filters.limit));

  // Navigate to detail page
  const handleViewDetail = (newsItem) => {
    const slug = typeof newsItem?.slug === "string" ? newsItem.slug.trim() : "";
    const newsId = Number(newsItem?.id);

    if (!slug && (!Number.isFinite(newsId) || newsId <= 0)) {
      return;
    }

    navigate(`/news/${slug || newsId}`, {
      state: { news: newsItem },
    });
  };

  const handleCardKeyDown = (event, newsItem) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleViewDetail(newsItem);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle limit change
  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  };

  // Handle sort change
  const handleSortChange = (value) => {
    const [sortBy, sortOrder] = value.split("-");
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  return (
    <NewsLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-(--text-primary) mb-2">
            Tin Tức
          </h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin nhanh chóng và chính xác để bạn luôn nắm bắt được
            những diễn biến mới nhất
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--text-tertiary)" />
            <Input
              type="text"
              placeholder="Tìm kiếm tin tức..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-full md:w-50">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published_at-DESC">Mới nhất</SelectItem>
              <SelectItem value="published_at-ASC">Cũ nhất</SelectItem>
              <SelectItem value="created_at-DESC">Ngày tạo mới</SelectItem>
              <SelectItem value="title-ASC">Theo tiêu đề</SelectItem>
            </SelectContent>
          </Select>

          {/* Limit */}
          <Select
            value={filters.limit.toString()}
            onValueChange={handleLimitChange}
          >
            <SelectTrigger className="w-full md:w-30">
              <SelectValue placeholder="Hiển thị" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 tin</SelectItem>
              <SelectItem value="12">12 tin</SelectItem>
              <SelectItem value="24">24 tin</SelectItem>
              <SelectItem value="50">50 tin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: filters.limit }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Không thể tải dữ liệu tin tức</p>
            <Button
              variant="soft-warning"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* News grid */}
        {!isLoading && !isError && (
          <>
            {newsData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-(--text-secondary)">
                  Không tìm thấy tin tức nào
                </p>
              </div>
            ) : (
              <>
                <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {isFetching && (
                    <div className="absolute inset-0 z-10 flex items-start justify-center rounded-lg bg-background/70 pt-24 backdrop-blur-sm">
                      <LoadingInline size="large" />
                    </div>
                  )}

                  {newsData.map((news, index) => {
                    const viewCount = Number(news.viewCount);
                    const hasViewCount =
                      Number.isFinite(viewCount) && viewCount > 0;

                    return (
                      <Card
                        key={news.id}
                        variant="interactive"
                        role="button"
                        tabIndex={0}
                        aria-label={`Đọc tin: ${news.title}`}
                        className={cn(
                          "group gap-0 overflow-hidden p-0",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        onClick={() => handleViewDetail(news)}
                        onKeyDown={(event) => handleCardKeyDown(event, news)}
                      >
                        <div className="relative h-52 overflow-hidden bg-muted">
                          {news.coverUrl ? (
                            <img
                              src={praseLink(news.coverUrl)}
                              alt={news.title}
                              loading={index > 2 ? "lazy" : "eager"}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-muted">
                              <div className="text-center text-muted-foreground">
                                <FileImage className="mx-auto mb-2 h-10 w-10" />
                                <span className="text-sm font-medium">
                                  Chưa có ảnh đại diện
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                            {news.status !== "published" && (
                              <Badge variant="secondary">Nháp</Badge>
                            )}
                          </div>
                        </div>

                        <CardContent className="flex min-h-72 flex-col p-5">
                          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(news.publishedAt || news.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              Đã xuất bản
                            </span>
                          </div>

                          <h2 className="line-clamp-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                            {news.title}
                          </h2>

                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {news.summary || "Nội dung tóm tắt đang cập nhật."}
                          </p>

                          <div className="mt-auto pt-5">
                            <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                              <span className="inline-flex min-w-0 items-center gap-1.5">
                                <User className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {news.authorName || "Ban biên tập"}
                                </span>
                              </span>
                              {hasViewCount && (
                                <span>
                                  {viewCount.toLocaleString("vi-VN")} lượt xem
                                </span>
                              )}
                            </div>

                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                              Đọc chi tiết
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
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
      </div>
    </NewsLayout>
  );
}
