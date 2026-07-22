import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const NEWS_PATH = "/news";
const ADMIN_COMMENTS_PATH = "/admin/comments";

export function getNewsComments(newsId, params = {}) {
  return fetcher(
    withQuery(`${NEWS_PATH}/${newsId}/comments`, {
      page: 1,
      limit: 20,
      lang: "vi",
      ...params,
    }),
  );
}

export function useGetNewsCommentsQuery(newsId, params = {}, options = {}) {
  return useApiQuery(
    ["news", newsId, "comments", params],
    withQuery(`${NEWS_PATH}/${newsId}/comments`, {
      page: 1,
      limit: 20,
      lang: "vi",
      ...params,
    }),
    {
      ...options,
      enabled:
        Boolean(newsId) &&
        (options.enabled === undefined ? true : options.enabled),
    },
  );
}

export function getAllComments(params = {}) {
  return fetcher(
    withQuery(ADMIN_COMMENTS_PATH, {
      page: 1,
      limit: 20,
      lang: "vi",
      ...params,
    }),
  );
}

export function useGetAllCommentsQuery(params = {}, options = {}) {
  return useApiQuery(
    ["comments", "list", params],
    withQuery(ADMIN_COMMENTS_PATH, {
      page: 1,
      limit: 20,
      lang: "vi",
      ...params,
    }),
    options,
  );
}

export function createNewsComment(newsId, content, lang = "vi") {
  return mutater(
    withQuery(`${NEWS_PATH}/${newsId}/comments`, { lang }),
    "POST",
    { content },
  );
}

export function approveComment(commentId, isApproved, lang = "vi") {
  return mutater(
    withQuery(`${ADMIN_COMMENTS_PATH}/${commentId}/approve`, { lang }),
    "PATCH",
    { isApproved },
  );
}

export function deleteComment(commentId, lang = "vi") {
  return mutater(
    withQuery(`${ADMIN_COMMENTS_PATH}/${commentId}`, { lang }),
    "DELETE",
  );
}

export function deleteOwnNewsComment(newsId, commentId, lang = "vi") {
  return mutater(
    withQuery(`${NEWS_PATH}/${newsId}/comments/${commentId}`, { lang }),
    "DELETE",
  );
}
