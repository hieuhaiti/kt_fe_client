import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const DOCUMENTS_PATH = "/documents";
const ADMIN_DOCUMENTS_PATH = "/admin/documents";

export const DOCUMENT_TYPE_LABELS = {
  bao_cao: "Báo cáo",
  van_ban: "Văn bản",
  pdf_map: "Bản đồ PDF",
};

export function normalizeDocument(item = {}) {
  const docType = item.docType ?? item.doc_type;
  const fileUrl = item.fileUrl ?? item.file_url;
  const fileName = item.fileName ?? item.file_name;
  const mimeType = item.mimeType ?? item.mime_type;
  const fileSize = item.fileSize ?? item.file_size;
  const isPublic = item.isPublic ?? item.is_public;
  const createdAt = item.createdAt ?? item.created_at;
  const updatedAt = item.updatedAt ?? item.updated_at;
  const uploadedByName = item.uploadedByName ?? item.uploaded_by_name;

  return {
    ...item,
    docType,
    doc_type: docType,
    fileUrl,
    file_url: fileUrl,
    fileName,
    file_name: fileName,
    mimeType,
    mime_type: mimeType,
    fileSize,
    file_size: fileSize,
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

export function useGetAllDocumentsQuery(params = {}, options = {}) {
  const endpoint = withQuery(DOCUMENTS_PATH, {
    page: 1,
    limit: 20,
    lang: "vi",
    ...params,
  });
  return useApiQuery(["documents", "list", params], endpoint, options);
}

export function getAllDocuments(params = {}) {
  return fetcher(
    withQuery(DOCUMENTS_PATH, {
      page: 1,
      limit: 20,
      lang: "vi",
      ...params,
    }),
  );
}

export function useGetDocumentDetailQuery(documentId, options = {}) {
  return useApiQuery(
    ["documents", "detail", documentId],
    withQuery(`${DOCUMENTS_PATH}/${documentId}`, { lang: "vi" }),
    {
      ...options,
      enabled:
        Boolean(documentId) &&
        (options.enabled === undefined ? true : options.enabled),
    },
  );
}

export function getDocumentDetail(documentId, lang = "vi") {
  return fetcher(withQuery(`${DOCUMENTS_PATH}/${documentId}`, { lang }));
}

export function getAdminDocumentDetail(documentId, lang = "vi") {
  return fetcher(withQuery(`${ADMIN_DOCUMENTS_PATH}/${documentId}`, { lang }));
}

export function createDocument(formData, lang = "vi") {
  return mutater(withQuery(ADMIN_DOCUMENTS_PATH, { lang }), "POST", formData);
}

export function updateDocument(documentId, payload, lang = "vi") {
  return mutater(
    withQuery(`${ADMIN_DOCUMENTS_PATH}/${documentId}`, { lang }),
    "PATCH",
    payload,
  );
}

export function replaceDocument(documentId, payload, lang = "vi") {
  return mutater(
    withQuery(`${ADMIN_DOCUMENTS_PATH}/${documentId}`, { lang }),
    "PUT",
    payload,
  );
}

export function deleteDocument(documentId, lang = "vi") {
  return mutater(
    withQuery(`${ADMIN_DOCUMENTS_PATH}/${documentId}`, { lang }),
    "DELETE",
  );
}
