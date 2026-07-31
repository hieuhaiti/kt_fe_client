import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const NEWS_PATH = "/news";
const ADMIN_COMMENTS_PATH = "/admin/comments";

export function getNewsComments(newsSlug, params = {}) {
  return fetcher(
    withQuery(`${NEWS_PATH}/${encodeURIComponent(newsSlug)}/comments`, {
      page: 1,
      limit: 20,
      lang: "vi",
      ...params,
    }),
  );
}

export function useGetNewsCommentsQuery(newsSlug, params = {}, options = {}) {
  return useApiQuery(
    ["news", newsSlug, "comments", params],
    withQuery(`${NEWS_PATH}/${encodeURIComponent(newsSlug)}/comments`, {
      page: 1,
      limit: 20,
      lang: "vi",
      ...params,
    }),
    {
      ...options,
      enabled:
        Boolean(newsSlug) &&
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

export function createNewsComment(newsSlug, content, lang = "vi") {
  return mutater(
    withQuery(`${NEWS_PATH}/${encodeURIComponent(newsSlug)}/comments`, {
      lang,
    }),
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

export function deleteOwnNewsComment(newsSlug, commentId, lang = "vi") {
  return mutater(
    withQuery(
      `${NEWS_PATH}/${encodeURIComponent(newsSlug)}/comments/${commentId}`,
      { lang },
    ),
    "DELETE",
  );
}
