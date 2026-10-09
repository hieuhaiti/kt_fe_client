/**
 * Normalizes upload errors to user-friendly, actionable Vietnamese messages.
 * Prevents technical English, internal stack traces, and raw HTTP error objects
 * from leaking to end users.
 */
export function normalizeUploadError(err) {
  if (!err) return "Không thể tải tệp lên. Hãy thử lại.";
  const raw = typeof err === "string" ? err : err?.message || "";
  const lower = raw.toLowerCase();

  // 1. File too large / oversized
  if (
    lower.includes("too large") ||
    lower.includes("oversized") ||
    lower.includes("maxsize") ||
    lower.includes("exceeds size") ||
    lower.includes("dung lượng")
  ) {
    return "Tệp quá lớn. Hãy chọn tệp nhỏ hơn.";
  }

  // 2. Unsupported type
  if (
    lower.includes("type not accepted") ||
    lower.includes("unsupported") ||
    lower.includes("invalid type") ||
    lower.includes("định dạng") ||
    lower.includes("mime")
  ) {
    return "Định dạng tệp không được hỗ trợ. Hãy chọn tệp khác.";
  }

  // 3. Network failure
  if (
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("timeout") ||
    lower.includes("mạng")
  ) {
    return "Kết nối không ổn định. Kiểm tra mạng rồi thử lại.";
  }

  // 4. Server reject / 4xx / 5xx
  if (
    lower.includes("server") ||
    lower.includes("reject") ||
    lower.includes("403") ||
    lower.includes("401") ||
    lower.includes("500") ||
    lower.includes("từ chối")
  ) {
    return "Máy chủ không nhận tệp. Hãy thử lại sau.";
  }

  // 5. Maximum files exceeded
  if (lower.includes("maximum") && lower.includes("files allowed")) {
    return "Số tệp vượt quá giới hạn.";
  }

  // 6. Generic safe fallback
  return "Không thể tải tệp lên. Kiểm tra tệp rồi thử lại.";
}
