import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const PDF_MAPS_PATH = "/pdf-maps";
const ADMIN_PDF_MAPS_PATH = "/admin/pdf-maps";

export const PDF_MAP_THEME_LABELS = {
  lop_phu_nhiet: "Lớp phủ nhiệt",
  chay_rung: "Cảnh báo cháy rừng",
  lop_phu_rung: "Lớp phủ rừng",
  khac: "Khác",
};

export function normalizePdfMap(item = {}) {
  const themeCode = item.themeCode ?? item.theme_code;
  const fileUrl = item.fileUrl ?? item.file_url;
  const fileName = item.fileName ?? item.file_name;
  const mimeType = item.mimeType ?? item.mime_type;
  const fileSize = item.fileSize ?? item.file_size;
  const thumbnailUrl = item.thumbnailUrl ?? item.thumbnail_url;
  const isPublic = item.isPublic ?? item.is_public;
  const createdAt = item.createdAt ?? item.created_at;
  const updatedAt = item.updatedAt ?? item.updated_at;
  const uploadedByName = item.uploadedByName ?? item.uploaded_by_name;

  return {
    ...item,
    themeCode,
    theme_code: themeCode,
    fileUrl,
    file_url: fileUrl,
    fileName,
    file_name: fileName,
    mimeType,
    mime_type: mimeType,
    fileSize,
    file_size: fileSize,
    thumbnailUrl,
    thumbnail_url: thumbnailUrl,
    isPublic,
    is_public: isPublic,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
    uploadedByName,
    uploaded_by_name: uploadedByName,
  };
}

export function getPdfMaps(params = {}) {
  return fetcher(
    withQuery(PDF_MAPS_PATH, { page: 1, limit: 20, lang: "vi", ...params }),
  );
}

export function useGetPdfMapsQuery(params = {}, options = {}) {
  return useApiQuery(
    ["pdf-maps", "list", params],
    withQuery(PDF_MAPS_PATH, { page: 1, limit: 20, lang: "vi", ...params }),
    options,
  );
}

export function getPdfMapDetail(pdfMapId, lang = "vi") {
  return fetcher(withQuery(`${PDF_MAPS_PATH}/${pdfMapId}`, { lang }));
}

export function useGetPdfMapDetailQuery(pdfMapId, options = {}) {
  return useApiQuery(
    ["pdf-maps", "detail", pdfMapId],
    withQuery(`${PDF_MAPS_PATH}/${pdfMapId}`, { lang: "vi" }),
    {
      ...options,
      enabled:
        Boolean(pdfMapId) &&
        (options.enabled === undefined ? true : options.enabled),
    },
  );
}

export function getAdminPdfMaps(params = {}) {
  return fetcher(
    withQuery(ADMIN_PDF_MAPS_PATH, {
      page: 1,
      limit: 20,
      lang: "vi",
      ...params,
    }),
  );
}

export function getAdminPdfMapDetail(pdfMapId) {
  return fetcher(withQuery(`${ADMIN_PDF_MAPS_PATH}/${pdfMapId}`, { lang: "vi" }));
}

export function createPdfMap(formData, lang = "vi") {
  return mutater(withQuery(ADMIN_PDF_MAPS_PATH, { lang }), "POST", formData);
}

export function replacePdfMap(pdfMapId, payload, lang = "vi") {
  return mutater(
    withQuery(`${ADMIN_PDF_MAPS_PATH}/${pdfMapId}`, { lang }),
    "PUT",
    payload,
  );
}

export function upsertPdfMapTranslation(pdfMapId, lang, payload) {
  return mutater(
    `${ADMIN_PDF_MAPS_PATH}/${pdfMapId}/translations/${lang}`,
    "PUT",
    payload,
  );
}

export function upsertPdfMapEnglishTranslation(pdfMapId, payload) {
  return upsertPdfMapTranslation(pdfMapId, "en", payload);
}

export function deletePdfMap(pdfMapId, lang = "vi") {
  return mutater(
    withQuery(`${ADMIN_PDF_MAPS_PATH}/${pdfMapId}`, { lang }),
    "DELETE",
  );
}
