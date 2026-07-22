import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Languages,
  Layers,
  Map,
  Ruler,
  Share2,
} from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, praseLink } from "@/lib/utils";
import NewsLayout from "@/layout/NewsLayout";
import { DocumentDetailSkeleton } from "@/pages/Documents/Skeleton";
import {
  PDF_MAP_THEME_LABELS,
  useGetPdfMapDetailQuery,
} from "@/services/pdfMapsService";

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

function getThemeLabel(themeCode) {
  return PDF_MAP_THEME_LABELS[themeCode] || "Bản đồ khác";
}

function isPdfFile(item) {
  const mimeType = item?.mimeType || "";
  const fileUrl = item?.fileUrl || "";
  return mimeType.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf");
}

function isImageFile(item) {
  const mimeType = item?.mimeType || "";
  const fileUrl = item?.fileUrl || "";
  return (
    mimeType.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(fileUrl)
  );
}

export default function PdfMapDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackPdfMap = location.state?.pdfMap || null;

  const { data, isLoading, isError } = useGetPdfMapDetailQuery(id);
  const pdfMap = data?.data || fallbackPdfMap;

  const parsedFileUrl = pdfMap?.fileUrl ? praseLink(pdfMap.fileUrl) : "";
  const isPdf = isPdfFile(pdfMap);
  const isImage = isImageFile(pdfMap);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = pdfMap?.title || "Bản đồ PDF WebGIS Kon Tum";

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
      toast.success("Đã sao chép liên kết bản đồ.");
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  const handleOpenFile = () => {
    if (!parsedFileUrl) return;
    window.open(parsedFileUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (pdfMap?.title) {
      document.title = `${pdfMap.title} - Bản đồ PDF Kon Tum`;
    }
  }, [pdfMap]);

  if (isLoading && !pdfMap) {
    return (
      <NewsLayout>
        <DocumentDetailSkeleton />
      </NewsLayout>
    );
  }

  if (isError || !pdfMap) {
    return (
      <NewsLayout>
        <main className="container mx-auto px-4 py-8 text-center">
          <Map className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Không tìm thấy bản đồ PDF
          </h1>
          <Button onClick={() => navigate("/pdf-maps")}>
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
          onClick={() => navigate("/pdf-maps")}
          className="mb-6"
        >
          <ArrowLeft />
          Quay lại danh sách
        </Button>

        <article>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="soft-info">
              <Layers />
              {getThemeLabel(pdfMap.themeCode)}
            </Badge>
            {pdfMap.year && <Badge variant="secondary">{pdfMap.year}</Badge>}
            {pdfMap.fallbackUsed && (
              <Badge variant="soft-warning">
                <Languages />
                Đang hiển thị bản dịch dự phòng
              </Badge>
            )}
          </div>

          <h1 className="mb-4 text-2xl font-bold leading-tight text-foreground md:text-4xl">
            {pdfMap.title || `Bản đồ PDF #${pdfMap.id}`}
          </h1>

          <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(pdfMap.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                {pdfMap.region || "Tỉnh Kon Tum"}
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
                onClick={handleOpenFile}
              >
                <Download />
                Mở bản đồ PDF
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="grid gap-4 p-4 text-sm md:grid-cols-2 md:p-5">
              <div className="flex items-start gap-3">
                <Ruler className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Tỷ lệ</p>
                  <p className="font-medium text-card-foreground">
                    {pdfMap.scale || "Chưa cập nhật"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-muted-foreground">Tên tệp</p>
                  <p className="truncate font-medium text-card-foreground">
                    {pdfMap.fileName || "Chưa có tên tệp"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Dung lượng</p>
                  <p className="font-medium text-card-foreground">
                    {formatFileSize(pdfMap.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Languages className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Ngôn ngữ dữ liệu</p>
                  <p className="font-medium text-card-foreground">
                    {(pdfMap.lang || "vi").toUpperCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {pdfMap.description && (
            <div className="mb-6 border-l-4 border-primary pl-4 text-base font-medium text-muted-foreground md:text-lg">
              {pdfMap.description}
            </div>
          )}

          <Card>
            <CardContent className="p-2">
              {!parsedFileUrl ? (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-lg bg-muted p-6 text-center">
                  <Map className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="font-medium text-foreground">
                    Bản đồ chưa có tệp đính kèm.
                  </p>
                </div>
              ) : isPdf ? (
                <div className="h-[70vh] min-h-[520px] w-full overflow-hidden rounded-lg bg-muted">
                  <object
                    data={parsedFileUrl}
                    type="application/pdf"
                    className="h-full w-full object-contain"
                  >
                    <div className="flex h-full min-h-[520px] flex-col items-center justify-center rounded-lg bg-muted p-6 text-center">
                      <Map className="mb-3 h-12 w-12 text-muted-foreground" />
                      <p className="mb-4 text-muted-foreground">
                        Trình duyệt không hỗ trợ xem PDF trực tiếp.
                      </p>
                      <Button onClick={handleOpenFile}>
                        <Download />
                        Mở bản đồ PDF
                      </Button>
                    </div>
                  </object>
                </div>
              ) : isImage ? (
                <div className="flex max-h-[80vh] min-h-[420px] items-center justify-center overflow-auto rounded-lg bg-muted">
                  <img
                    src={parsedFileUrl}
                    alt={pdfMap.title || "Bản đồ"}
                    className="h-auto max-h-[80vh] w-auto max-w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-lg bg-muted p-6 text-center">
                  <FileText className="mb-3 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">
                    Không hỗ trợ xem trước định dạng tệp này.
                  </p>
                  <Button onClick={handleOpenFile}>
                    <Download />
                    Mở tệp
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </article>
      </main>
    </NewsLayout>
  );
}
