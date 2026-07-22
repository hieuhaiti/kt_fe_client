import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const REMOTE_SENSING_PATH = "/remote-sensing";
const IMAGES_PATH = `${REMOTE_SENSING_PATH}/images`;
const DEFAULT_LANG = "vi";

export const REMOTE_SENSING_WS_EVENTS = Object.freeze({
  STATISTICS_READY: "remote_sensing:statistics_ready",
  JOB_COMPLETED: "remote_sensing:job_completed",
  JOB_FAILED: "remote_sensing:job_failed",
});

export function getRemoteSensingChannel(imageId) {
  if (imageId === undefined || imageId === null || imageId === "") return "";
  return `remote_sensing:${imageId}`;
}

export function isRemoteSensingWebSocketEvent(message) {
  return Object.values(REMOTE_SENSING_WS_EVENTS).includes(message?.event);
}

export function getRemoteSensingImages(params = {}) {
  return fetcher(
    withQuery(IMAGES_PATH, {
      page: 1,
      limit: 10,
      lang: DEFAULT_LANG,
      ...params,
    }),
  );
}

export function useGetRemoteSensingImagesQuery(params = {}, options = {}) {
  return useApiQuery(
    ["remote-sensing", "images", params],
    withQuery(IMAGES_PATH, {
      page: 1,
      limit: 10,
      lang: DEFAULT_LANG,
      ...params,
    }),
    options,
  );
}

export function getRemoteSensingImage(imageId, lang = DEFAULT_LANG) {
  return fetcher(withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}`, { lang }));
}

export function useGetRemoteSensingImageQuery(imageId, options = {}) {
  return useApiQuery(
    ["remote-sensing", "images", imageId],
    withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}`, {
      lang: DEFAULT_LANG,
    }),
    {
      enabled: Boolean(imageId),
      ...options,
    },
  );
}

export function getRemoteSensingImageStatistics(imageId, lang = DEFAULT_LANG) {
  return fetcher(
    withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}/statistics`, {
      lang,
    }),
  );
}

export function useGetRemoteSensingImageStatisticsQuery(imageId, options = {}) {
  return useApiQuery(
    ["remote-sensing", "images", imageId, "statistics"],
    withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}/statistics`, {
      lang: DEFAULT_LANG,
    }),
    {
      enabled: Boolean(imageId),
      ...options,
    },
  );
}

export function getRemoteSensingCogUrl(imageId, lang = DEFAULT_LANG) {
  return fetcher(
    withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}/cog-url`, {
      lang,
    }),
  );
}

export function useGetRemoteSensingCogUrlQuery(imageId, options = {}) {
  return useApiQuery(
    ["remote-sensing", "images", imageId, "cog-url"],
    withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}/cog-url`, {
      lang: DEFAULT_LANG,
    }),
    {
      enabled: Boolean(imageId),
      ...options,
    },
  );
}

export function getRemoteSensingLayers(params = {}) {
  return fetcher(
    withQuery(`${REMOTE_SENSING_PATH}/layers`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
  );
}

export function useGetRemoteSensingLayersQuery(params = {}, options = {}) {
  return useApiQuery(
    ["remote-sensing", "layers", params],
    withQuery(`${REMOTE_SENSING_PATH}/layers`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
    options,
  );
}

export function getRemoteSensingUploadUrl(fileName, lang = DEFAULT_LANG) {
  return fetcher(
    withQuery(`${REMOTE_SENSING_PATH}/upload-url`, {
      file_name: fileName,
      lang,
    }),
  );
}

export function uploadRemoteSensingImage(formData, lang = DEFAULT_LANG) {
  return mutater(withQuery(IMAGES_PATH, { lang }), "POST", formData);
}

export function updateRemoteSensingImage(imageId, payload, lang = DEFAULT_LANG) {
  return mutater(
    withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}`, { lang }),
    "PATCH",
    payload,
  );
}

export function getRemoteSensingDownloadUrl(imageId, fileId, lang = DEFAULT_LANG) {
  return fetcher(
    withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}/download`, {
      lang,
      file_id: fileId,
    }),
  );
}

export function processRemoteSensingImage(
  imageId,
  payload = { job_type: "full_pipeline", priority: 5 },
  lang = DEFAULT_LANG,
) {
  return mutater(
    withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}/process`, { lang }),
    "POST",
    payload,
  );
}

export function deleteRemoteSensingImage(
  imageId,
  hardDelete = false,
  lang = DEFAULT_LANG,
) {
  return mutater(
    withQuery(`${IMAGES_PATH}/${encodeURIComponent(imageId)}`, {
      lang,
      hard_delete: hardDelete,
    }),
    "DELETE",
  );
}
