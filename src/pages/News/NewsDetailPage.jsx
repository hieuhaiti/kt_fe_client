import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock3,
  FileImage,
  Home,
  MessageCircle,
  Send,
  Share2,
  Tag,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import PaginationCustom from "@/components/common/PaginationCustom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import NewsLayout from "@/layout/NewsLayout";
import { formatDate, isHtmlContent, praseLink } from "@/lib/utils";
import { createNewsComment, useGetNewsCommentsQuery } from "@/services/commentsService";
import { useGetNewsDetailBySlugQuery } from "@/services/newsService";
import useAuthStore from "@/stores/useAuthStore";
import { DetailSkeleton } from "./Skeleton";

const getCommentInitials = (name) => {
  const normalizedName = String(name || "Người dùng").trim();
  return normalizedName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default function NewsDetailPage() {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const [commentPage, setCommentPage] = useState(1);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const normalizedParam = typeof slugOrId === "string" ? slugOrId.trim() : "";
  const hasNewsSlug = Boolean(normalizedParam);

  const {
    data,
    isLoading,
    isError,
  } = useGetNewsDetailBySlugQuery(normalizedParam, {
    enabled: hasNewsSlug,
  });
  const news = data?.data || null;
  const hasHtmlContent = isHtmlContent(news?.content);
  const sanitizedContent = useMemo(
    () => DOMPurify.sanitize(news?.content || ""),
    [news?.content],
  );
  const viewCount = Number(news?.viewCount);
  const hasViewCount = Number.isFinite(viewCount) && viewCount > 0;
  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    isError: isCommentsError,
  } = useGetNewsCommentsQuery(
    news?.id,
    {
      page: commentPage,
      limit: 10,
      lang: "vi",
    },
    {
      enabled: Boolean(news?.id),
      retry: false,
    },
  );
  const comments = Array.isArray(commentsData?.data?.items)
    ? commentsData.data.items
    : [];
  const commentsPagination = commentsData?.metadata || null;
  const commentsTotal = commentsPagination?.total ?? comments.length;
  const commentsTotalPages = commentsPagination?.totalPages ?? 1;

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) {
      toast.warning("Vui lòng nhập nội dung bình luận.");
      textareaRef.current?.focus();
      return;
    }
    if (trimmed.length > 1000) {
      toast.warning("Bình luận không được vượt quá 1000 ký tự.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createNewsComment(news.id, trimmed);
      toast.success("Bình luận đã được gửi và đang chờ kiểm duyệt.");
      setCommentText("");
    } catch (err) {
      if (err?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else {
        toast.error("Gửi bình luận thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = news?.title || "Tin tức WebGIS Kon Tum";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
      } catch {
        // Người dùng chủ động đóng hộp thoại chia sẻ.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Đã sao chép liên kết bài viết");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  useEffect(() => {
    if (news?.title) {
      document.title = `${news.title} - WebGIS Kon Tum`;
    }
  }, [news]);

  if (isLoading) {
    return (
      <NewsLayout>
        <DetailSkeleton />
      </NewsLayout>
    );
  }

  if (!hasNewsSlug || isError || !news) {
    return (
      <NewsLayout>
        <div className="min-h-screen bg-(image:--gradient-surface-page)">
          <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-10">
            <div className="max-w-lg rounded-lg border border-border bg-card p-8 text-center shadow-sm">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
              <h1 className="text-2xl font-semibold text-foreground">
                Không tìm thấy tin tức
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Bài viết có thể đã được gỡ hoặc đường dẫn không còn hợp lệ.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button variant="outline" onClick={() => navigate("/")}>
                  <Home className="h-4 w-4" />
                  Về bản đồ
                </Button>
                <Button onClick={() => navigate("/news")}>
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại danh sách
                </Button>
              </div>
            </div>
          </div>
        </div>
      </NewsLayout>
    );
  }

  return (
    <NewsLayout>
      <div className="min-h-screen bg-(image:--gradient-surface-page)">
        <article className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/news")}
              className="bg-card/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại danh sách
            </Button>

            <Button
              variant="soft-info"
              onClick={handleShare}
              className="bg-card/80"
            >
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </Button>
          </div>

          <header className="rounded-lg border border-border bg-card/90 p-5 shadow-sm backdrop-blur sm:p-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {news.isFeatured && (
                <Badge variant="soft-warning">Tin nổi bật</Badge>
              )}
              <Badge variant="soft-primary">Tin đã xuất bản</Badge>
            </div>

            <h1 className="max-w-4xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              {news.title}
            </h1>

            {news.summary && (
              <p className="mt-4 max-w-4xl border-l-4 border-primary pl-4 text-base font-medium leading-7 text-muted-foreground sm:text-lg">
                {news.summary}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                {news.authorName || "Ban biên tập"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(news.publishedAt || news.createdAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Cập nhật {formatDate(news.updatedAt || news.createdAt)}
              </span>
              {hasViewCount && (
                <span>{viewCount.toLocaleString("vi-VN")} lượt xem</span>
              )}
            </div>
          </header>

          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
            {news.coverUrl ? (
              <img
                src={praseLink(news.coverUrl)}
                alt={news.title}
                className="h-[18rem] w-full object-cover sm:h-[26rem] lg:h-[30rem]"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-72 items-center justify-center bg-muted text-muted-foreground">
                <div className="text-center">
                  <FileImage className="mx-auto mb-2 h-12 w-12" />
                  <span className="text-sm font-medium">
                    Bài viết chưa có ảnh đại diện
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mx-auto mt-8 max-w-3xl">
            {hasHtmlContent ? (
              <div
                className="text-base leading-8 text-foreground [&_a]:font-medium [&_a]:text-primary [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-xl [&_img]:my-6 [&_img]:rounded-lg [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-5 [&_strong]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            ) : (
              <div className="whitespace-pre-line text-base leading-8 text-foreground">
                {news.content || "Nội dung bài viết đang được cập nhật."}
              </div>
            )}

            {Array.isArray(news.tags) && news.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-5">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {news.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <footer className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
              <p>Xuất bản: {formatDate(news.publishedAt || news.createdAt)}</p>
              {news.updatedAt && news.updatedAt !== news.createdAt && (
                <p className="mt-1">
                  Cập nhật lần cuối: {formatDate(news.updatedAt)}
                </p>
              )}
            </footer>

            <section
              className="mt-8 border-t border-border pt-6"
              aria-labelledby="news-comments-title"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2
                    id="news-comments-title"
                    className="flex items-center gap-2 text-xl font-semibold text-foreground"
                  >
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Bình luận
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {commentsTotal > 0
                      ? `${commentsTotal.toLocaleString("vi-VN")} bình luận đã được duyệt`
                      : "Các bình luận đã duyệt sẽ hiển thị tại đây."}
                  </p>
                </div>
              </div>

              {isAuthenticated ? (
                <form
                  onSubmit={handleSubmitComment}
                  className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <label
                    htmlFor="comment-textarea"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Viết bình luận của bạn
                  </label>
                  <Textarea
                    id="comment-textarea"
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Nhập bình luận... (tối đa 1000 ký tự)"
                    rows={4}
                    maxLength={1000}
                    disabled={isSubmitting}
                    className="resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {commentText.length}/1000
                    </span>
                    <Button
                      type="submit"
                      disabled={isSubmitting || commentText.trim().length === 0}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                      {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Bình luận sẽ được hiển thị sau khi được kiểm duyệt.
                  </p>
                </form>
              ) : (
                <div className="mb-6 rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground shadow-sm">
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Đăng nhập
                  </Link>{" "}
                  để gửi bình luận về bài viết này.
                </div>
              )}

              {isCommentsLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex gap-3">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                        <div className="w-full space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-4/5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isCommentsLoading && isCommentsError && (
                <div className="rounded-lg border border-destructive/30 bg-card p-5 text-sm text-muted-foreground">
                  Không thể tải bình luận của bài viết.
                </div>
              )}

              {!isCommentsLoading &&
                !isCommentsError &&
                comments.length === 0 && (
                  <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
                    Chưa có bình luận nào được duyệt.
                  </div>
                )}

              {!isCommentsLoading &&
                !isCommentsError &&
                comments.length > 0 && (
                  <>
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <article
                          key={comment.id}
                          className="rounded-lg border border-border bg-card p-4 shadow-sm"
                        >
                          <div className="flex gap-3">
                            {comment.userAvatar ? (
                              <img
                                src={praseLink(comment.userAvatar)}
                                alt={comment.userName || "Người bình luận"}
                                className="h-10 w-10 shrink-0 rounded-full object-cover"
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {getCommentInitials(comment.userName)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <h3 className="text-sm font-semibold text-foreground">
                                  {comment.userName || "Người dùng"}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>

                    {commentsTotalPages > 1 && (
                      <div className="mt-6 flex justify-center">
                        <PaginationCustom
                          currentPage={commentPage}
                          totalPages={commentsTotalPages}
                          onPageChange={setCommentPage}
                        />
                      </div>
                    )}
                  </>
                )}
            </section>
          </div>

          <div className="mx-auto mt-8 flex max-w-3xl justify-start">
            <Button variant="outline" onClick={() => navigate("/news")}>
              <ArrowLeft className="h-4 w-4" />
              Quay lại tin tức
            </Button>
          </div>
        </article>
      </div>
    </NewsLayout>
  );
}
