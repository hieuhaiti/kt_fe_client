import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Download,
  Eye,
  File,
  FileText,
  Languages,
  Search,
  UserRound,
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
  DOCUMENT_TYPE_LABELS,
  useGetAllDocumentsQuery,
} from "@/services/documentsService";
import { DocumentSkeletonCard } from "./Skeleton";

const ALL_DOCUMENT_TYPES = "all";

function formatFileSize(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "Không rõ dung lượng";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getFileUrl(item) {
  return item?.fileUrl || "";
}

function isPdfDocument(item) {
  const mimeType = item?.mimeType || "";
  const fileUrl = getFileUrl(item) || "";
  return mimeType.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf");
}

function getTypeLabel(type) {
  return DOCUMENT_TYPE_LABELS[type] || "Tài liệu";
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    docType: ALL_DOCUMENT_TYPES,
    sortBy: "created_at",
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
      docType:
        filters.docType === ALL_DOCUMENT_TYPES ? undefined : filters.docType,
    }),
    [debouncedSearch, filters],
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useGetAllDocumentsQuery(queryParams);

  const documents = Array.isArray(data?.data?.items) ? data.data.items : [];

  const pagination = data?.metadata || {};
  const total = Number(pagination.total || documents.length);
  const totalPages =
    Number(pagination.totalPages) ||
    Math.max(1, Math.ceil(total / filters.limit));

  const handleViewDetail = (item) => {
    navigate(`/documents/${item.id}`, { state: { document: item } });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({
      ...prev,
      limit: Number(newLimit),
      page: 1,
    }));
  };

  const handleDocTypeChange = (docType) => {
    setFilters((prev) => ({ ...prev, docType, page: 1 }));
  };

  const handleSortChange = (value) => {
    const [sortBy, sortOrder] = value.split("-");
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  return (
    <NewsLayout>
      <main className="container mx-auto px-4 py-6 md:py-8">
        <section className="mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
              Báo cáo và văn bản
            </h1>
            <p className="mt-2  text-sm text-muted-foreground md:text-base">
              Tra cứu văn bản, báo cáo và tài liệu công khai phục vụ quản lý tài
              nguyên rừng, môi trường và WebGIS Kon Tum.
            </p>
          </div>
        </section>

        <section
          className="mb-6 flex flex-col gap-3 md:flex-row md:items-center"
          aria-label="Bộ lọc tài liệu"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm theo tiêu đề hoặc mô tả"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setFilters((prev) => ({ ...prev, page: 1 }));
              }}
              className="pl-10"
            />
          </div>

          <div className="w-full md:w-[180px]">
            <Select value={filters.docType} onValueChange={handleDocTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Loại tài liệu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DOCUMENT_TYPES}>Tất cả loại</SelectItem>
                <SelectItem value="bao_cao">Báo cáo</SelectItem>
                <SelectItem value="van_ban">Văn bản</SelectItem>
                <SelectItem value="pdf_map">Bản đồ PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-[170px]">
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-DESC">Mới nhất</SelectItem>
                <SelectItem value="created_at-ASC">Cũ nhất</SelectItem>
                <SelectItem value="title-ASC">Tiêu đề A-Z</SelectItem>
                <SelectItem value="title-DESC">Tiêu đề Z-A</SelectItem>
                <SelectItem value="doc_type-ASC">Loại tài liệu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-[140px]">
            <Select
              value={String(filters.limit)}
              onValueChange={handleLimitChange}
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
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 font-medium">
              Không thể tải danh sách báo cáo và văn bản.
            </p>
            <Button variant="soft-warning" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {documents.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-card-foreground">
                <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="font-medium">Không tìm thấy tài liệu phù hợp.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thử thay đổi từ khóa, loại tài liệu hoặc cách sắp xếp.
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

                  {documents.map((item) => {
                    const fileUrl = getFileUrl(item);
                    const parsedFileUrl = fileUrl ? praseLink(fileUrl) : "";

                    return (
                      <Card
                        key={item.id}
                        variant="interactive"
                        role="button"
                        tabIndex={0}
                        className="group cursor-pointer overflow-hidden py-0"
                        onClick={() => handleViewDetail(item)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleViewDetail(item);
                          }
                        }}
                      >
                        <div className="relative h-36 overflow-hidden border-b border-border bg-muted">
                          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                            <Badge variant="soft-primary">
                              {getTypeLabel(item.docType)}
                            </Badge>
                            {item.fallbackUsed && (
                              <Badge variant="soft-warning">
                                <Languages />
                                Bản dịch dự phòng
                              </Badge>
                            )}
                          </div>

                          {isPdfDocument(item) ? (
                            <div className="flex h-full items-center justify-center bg-(image:--gradient-surface-map)">
                              <div className="rounded-lg border border-border bg-card/90 p-4 text-center shadow-sm">
                                <FileText className="mx-auto mb-2 h-10 w-10 text-primary" />
                                <p className="text-xs font-medium text-card-foreground">
                                  PDF
                                </p>
                              </div>
                            </div>
                          ) : fileUrl ? (
                            <img
                              src={parsedFileUrl}
                              alt={item.title || "Tài liệu"}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-muted">
                              <File className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <CardContent className="flex flex-1 flex-col p-4">
                          <div className="mb-3">
                            <h2 className="line-clamp-2 min-h-12 text-base font-semibold leading-6 text-card-foreground transition-colors group-hover:text-primary">
                              {item.title || `Tài liệu #${item.id}`}
                            </h2>
                            <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                              {item.description || "Chưa có mô tả."}
                            </p>
                          </div>

                          <div className="mt-auto space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <File className="h-3.5 w-3.5" />
                              <span className="truncate">
                                {item.fileName || "Tệp đính kèm"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UserRound className="h-3.5 w-3.5" />
                              <span className="truncate">
                                {item.uploadedByName ||
                                  "Chưa cập nhật người tải"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(item.createdAt)}
                              </span>
                              <span>{formatFileSize(item.fileSize)}</span>
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
                                handleViewDetail(item);
                              }}
                            >
                              <Eye />
                              Chi tiết
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!fileUrl}
                              aria-label="Mở tệp tài liệu"
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
