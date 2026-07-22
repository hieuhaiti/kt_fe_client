import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { withQuery } from "@/services/apiClient/request";

const FEEDBACK_PATH = "/feedback";
const ADMIN_FEEDBACK_PATH = "/admin/feedback";
const DEFAULT_LANG = "vi";
const ANONYMOUS_ID_KEY = "kt_feedback_anonymous_id";

function createUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getFeedbackAnonymousId() {
  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (existing) return existing;

  const anonymousId = createUuid();
  window.localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  return anonymousId;
}

function getAnonymousHeaders(anonymousId = getFeedbackAnonymousId()) {
  return anonymousId ? { "x-anonymous-id": anonymousId } : {};
}

function buildFeedbackBody(payload) {
  if (payload instanceof FormData) return payload;

  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (key === "media" && Array.isArray(value)) {
      value.forEach((file) => formData.append("media", file));
      return;
    }
    formData.append(key, value);
  });
  return formData;
}

export function createFeedback(payload, options = {}) {
  const { anonymousId, lang = DEFAULT_LANG } = options;

  return mutater(
    withQuery(FEEDBACK_PATH, { lang }),
    "POST",
    buildFeedbackBody(payload),
    { headers: getAnonymousHeaders(anonymousId) },
  );
}

export function getMyFeedback(params = {}, options = {}) {
  const { anonymousId, lang = DEFAULT_LANG } = options;

  return fetcher(
    withQuery(`${FEEDBACK_PATH}/mine`, {
      page: 1,
      limit: 20,
      lang,
      ...params,
    }),
    { headers: getAnonymousHeaders(anonymousId) },
  );
}

export function useGetMyFeedbackQuery(params = {}, options = {}) {
  const { anonymousId, lang = DEFAULT_LANG, ...queryOptions } = options;

  return useQuery({
    queryKey: ["feedback", "mine", params, anonymousId || "local"],
    queryFn: () => getMyFeedback(params, { anonymousId, lang }),
    ...queryOptions,
  });
}

export function getFeedbackDetail(feedbackId, options = {}) {
  const { anonymousId, lang = DEFAULT_LANG } = options;

  return fetcher(
    withQuery(`${FEEDBACK_PATH}/${encodeURIComponent(feedbackId)}`, { lang }),
    { headers: getAnonymousHeaders(anonymousId) },
  );
}

export function useGetFeedbackDetailQuery(feedbackId, options = {}) {
  const { anonymousId, lang = DEFAULT_LANG, ...queryOptions } = options;

  return useQuery({
    queryKey: ["feedback", "detail", feedbackId, anonymousId || "local"],
    queryFn: () => getFeedbackDetail(feedbackId, { anonymousId, lang }),
    enabled:
      Boolean(feedbackId) &&
      (queryOptions.enabled === undefined ? true : queryOptions.enabled),
    ...queryOptions,
  });
}

export function getAdminFeedback(params = {}) {
  return fetcher(
    withQuery(ADMIN_FEEDBACK_PATH, {
      page: 1,
      limit: 20,
      lang: DEFAULT_LANG,
      ...params,
    }),
  );
}

export function getAdminFeedbackDetail(feedbackId, lang = DEFAULT_LANG) {
  return fetcher(
    withQuery(`${ADMIN_FEEDBACK_PATH}/${encodeURIComponent(feedbackId)}`, {
      lang,
    }),
  );
}

export function getAdminFeedbackMap(params = {}) {
  return fetcher(
    withQuery(`${ADMIN_FEEDBACK_PATH}/map`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
  );
}

export function updateFeedbackStatus(feedbackId, payload, lang = DEFAULT_LANG) {
  return mutater(
    withQuery(`${ADMIN_FEEDBACK_PATH}/${feedbackId}/status`, { lang }),
    "PATCH",
    payload,
  );
}
