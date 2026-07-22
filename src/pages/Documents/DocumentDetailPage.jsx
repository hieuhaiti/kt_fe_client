import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Download,
  File,
  FileText,
  Languages,
  Share2,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, praseLink } from "@/lib/utils";
import NewsLayout from "@/layout/NewsLayout";
import {
  DOCUMENT_TYPE_LABELS,
  useGetDocumentDetailQuery,
} from "@/services/documentsService";
import { DocumentDetailSkeleton } from "./Skeleton";

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

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackDocument = location.state?.document || null;

  const { data, isLoading, isError } = useGetDocumentDetailQuery(id);

  const documentData = data?.data || fallbackDocument;

  const fileUrl = getFileUrl(documentData);
  const parsedFileUrl = fileUrl ? praseLink(fileUrl) : "";

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = documentData?.title || "Tài liệu WebGIS Kon Tum";

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } catch {
        // User cancelled native sharing.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép liên kết tài liệu.");
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  const handleDownload = () => {
    if (!parsedFileUrl) return;
    window.open(parsedFileUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (documentData?.title) {
      document.title = `${documentData.title} - WebGIS Kon Tum`;
    }
  }, [documentData]);

  if (isLoading && !documentData) {
    return (
      <NewsLayout>
        <DocumentDetailSkeleton />
      </NewsLayout>
    );
  }

  if (isError || !documentData) {
    return (
      <NewsLayout>
        <main className="container mx-auto px-4 py-8 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Không tìm thấy tài liệu
          </h1>
          <Button onClick={() => navigate("/documents")}>
            <ArrowLeft />
            Quay lại danh sách
          </Button>
        </main>
      </NewsLayout>
    );
  }

  return (
    <NewsLayout>
      <main className="container mx-auto max-w-5xl px-4 py-6 md:py-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/documents")}
          className="mb-6"
        >
          <ArrowLeft />
          Quay lại danh sách
        </Button>

        <article>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="soft-primary">
              {getTypeLabel(documentData.docType)}
            </Badge>
            {documentData.fallbackUsed && (
              <Badge variant="soft-warning">
                <Languages />
                Đang hiển thị bản dịch dự phòng
              </Badge>
            )}
          </div>

          <h1 className="mb-4 text-2xl font-bold leading-tight text-foreground md:text-4xl">
            {documentData.title || `Tài liệu #${documentData.id}`}
          </h1>

          <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(documentData.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {documentData.uploadedByName || "Chưa cập nhật người tải"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 md:ml-auto">
              <Button variant="soft-info" size="sm" onClick={handleShare}>
                <Share2 />
                Chia sẻ
              </Button>
              <Button
                variant="soft-primary"
                size="sm"
                disabled={!parsedFileUrl}
                onClick={handleDownload}
              >
                <Download />
                Mở tệp
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="grid gap-4 p-4 text-sm md:grid-cols-2 md:p-5">
              <div className="flex items-start gap-3">
                <File className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-muted-foreground">Tên tệp</p>
                  <p className="truncate font-medium text-card-foreground">
                    {documentData.fileName || "Chưa có tên tệp"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Định dạng</p>
                  <p className="font-medium text-card-foreground">
                    {(documentData.mimeType || "Không rõ").toUpperCase()} ·{" "}
                    {formatFileSize(documentData.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Languages className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Ngôn ngữ dữ liệu</p>
                  <p className="font-medium text-card-foreground">
                    {(documentData.lang || "vi").toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Cập nhật</p>
                  <p className="font-medium text-card-foreground">
                    {formatDate(documentData.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {documentData.description && (
            <div className="mb-6 border-l-4 border-primary pl-4 text-base font-medium text-muted-foreground md:text-lg">
              {documentData.description}
            </div>
          )}

          <Card>
            <CardContent className="p-2">
              {!parsedFileUrl ? (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-lg bg-muted p-6 text-center">
                  <FileText className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="font-medium text-foreground">
                    Tài liệu chưa có tệp đính kèm.
                  </p>
                </div>
              ) : isPdfDocument(documentData) ? (
                <div className="relative min-h-[500px] w-full md:h-[80vh]">
                  <object
                    data={parsedFileUrl}
                    type="application/pdf"
                    className="h-full min-h-[500px] w-full rounded-lg"
                  >
                    <div className="flex h-full min-h-[500px] flex-col items-center justify-center rounded-lg bg-muted p-6 text-center">
                      <FileText className="mb-3 h-12 w-12 text-muted-foreground" />
                      <p className="mb-4 text-muted-foreground">
                        Trình duyệt không hỗ trợ xem PDF trực tiếp.
                      </p>
                      <Button onClick={handleDownload}>
                        <Download />
                        Mở file PDF
                      </Button>
                    </div>
                  </object>
                </div>
              ) : (
                <img
                  src={parsedFileUrl}
                  alt={documentData.title || "Tài liệu"}
                  className="max-h-[80vh] w-full rounded-lg object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </CardContent>
          </Card>
        </article>
      </main>
    </NewsLayout>
  );
}
