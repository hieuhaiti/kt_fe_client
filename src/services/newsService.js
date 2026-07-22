import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const NEWS_PATH = "/news";
const ADMIN_NEWS_PATH = "/admin/news";

export function useGetAllNewsQuery(params = {}, options = {}) {
  const endpoint = withQuery(NEWS_PATH, {
    page: 1,
    limit: 20,
    lang: "vi",
    sortBy: "published_at",
    sortOrder: "DESC",
    ...params,
  });
  return useApiQuery(["news", "list", params], endpoint, options);
}

export function getAllNews(params = {}) {
  return fetcher(
    withQuery(NEWS_PATH, {
      page: 1,
      limit: 20,
      lang: "vi",
      sortBy: "published_at",
      sortOrder: "DESC",
      ...params,
    }),
  );
}

export function useGetNewsDetailBySlugQuery(slug, options = {}) {
  const normalizedSlug = String(slug || "").trim();
  return useApiQuery(
    ["news", "detail", normalizedSlug],
    withQuery(`${NEWS_PATH}/${encodeURIComponent(normalizedSlug)}`, {
      lang: "vi",
    }),
    {
      ...options,
      enabled:
        Boolean(normalizedSlug) &&
        (options.enabled === undefined ? true : options.enabled),
    },
  );
}

export const useGetNewsDetailQuery = useGetNewsDetailBySlugQuery;

export function getNewsDetailBySlug(slug, lang = "vi") {
  return fetcher(
    withQuery(`${NEWS_PATH}/${encodeURIComponent(slug)}`, { lang }),
  );
}

export const getNewsDetail = getNewsDetailBySlug;

export function getAdminNewsDetail(newsId, lang = "vi") {
  return fetcher(withQuery(`${ADMIN_NEWS_PATH}/${newsId}`, { lang }));
}

export function createNews(formData, lang = "vi") {
  return mutater(withQuery(ADMIN_NEWS_PATH, { lang }), "POST", formData);
}

export function updateNews(newsId, payload, lang = "vi") {
  return mutater(
    withQuery(`${ADMIN_NEWS_PATH}/${newsId}`, { lang }),
    "PATCH",
    payload,
  );
}

export function replaceNews(newsId, payload, lang = "vi") {
  return mutater(
    withQuery(`${ADMIN_NEWS_PATH}/${newsId}`, { lang }),
    "PUT",
    payload,
  );
}

export function deleteNews(newsId, lang = "vi") {
  return mutater(withQuery(`${ADMIN_NEWS_PATH}/${newsId}`, { lang }), "DELETE");
}
