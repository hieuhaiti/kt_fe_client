# Hướng dẫn sử dụng API service client

## 1. Thiết lập chung

Nguồn API chuẩn là [`server/postman/Kontum-API.postman_collection.json`](../../server/postman/Kontum-API.postman_collection.json). Riêng payload WebSocket xử lý ảnh viễn thám còn phải đối chiếu với [`server/src/workers/imageProcessing.worker.js`](../../server/src/workers/imageProcessing.worker.js).

`VITE_BASE_URL_BE` phải trỏ đến base API đã chứa prefix `/api/v1`. `VITE_WS_URL` trỏ đến host backend; `realtimeNotificationService` tự đổi `http` sang `ws` và nối `/ws?token=<accessToken>`.

```js
import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
```

Không gọi `fetch()` trực tiếp trong component cho các endpoint đã có service. Service sẽ tự thêm `Authorization`, serialize JSON, parse response/error và refresh access token khi phù hợp.

Response thành công được giữ nguyên theo backend, thường có dạng:

```js
{ message, status, data, metadata }
```

## 2. Query và mutation với React Query

Service list/detail có thể cung cấp hàm thường và hook:

```jsx
import { useGetAllNewsQuery } from "@/services/newsService";

function NewsList() {
  const query = useGetAllNewsQuery({ page: 1, lang: "vi" });
  if (query.isLoading) return <p>Đang tải...</p>;
  if (query.isError) return <p>Không thể tải dữ liệu.</p>;
  return query.data?.data?.items?.map((item) => <p key={item.id}>{item.title}</p>);
}
```

Với mutation, gọi hàm service trong `useMutation`; sau thành công invalidate query key liên quan.

```jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markNotificationAsRead } from "@/services/notificationService";

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (notificationId) => markNotificationAsRead(notificationId),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
});
```

## 3. Danh sách service và hàm sử dụng

### Xác thực — `authService.js`

```js
import {
  login, register, refreshToken, forgotPassword, resetPassword,
  verifyEmail, resendVerification, getGoogleLoginUrl, googleMobileLogin,
  exchangeOAuthCode, getProfile, updateProfile, changePassword,
  setPassword, logout,
} from "@/services/authService";
```

| Hàm | Endpoint | Payload theo collection |
| --- | --- | --- |
| `register(payload, lang)` | `POST /auth/register` | `{ email, password, fullName, phone }` |
| `login(payload, lang)` | `POST /auth/login` | `{ email, password }` |
| `refreshToken(lang)` | `POST /auth/refresh` | Tự dùng `{ refreshToken }` đang lưu |
| `forgotPassword(email, lang)` | `POST /auth/forgot-password` | `{ email }` |
| `resetPassword(payload, lang)` | `POST /auth/reset-password` | `{ token, newPassword }` |
| `verifyEmail(token, lang)` | `POST /auth/verify-email` | `{ token }` |
| `resendVerification(email, lang)` | `POST /auth/resend-verification` | `{ email }` |
| `getGoogleLoginUrl(lang)` | `GET /auth/google` | Mở URL trả về bằng browser navigation |
| `googleMobileLogin(idToken, lang)` | `POST /auth/google/mobile` | `{ idToken }` |
| `exchangeOAuthCode(code, lang)` | `POST /auth/oauth/exchange` | `{ code }` |
| `getProfile(lang)` | `GET /auth/me` | — |
| `updateProfile(payload, lang)` | `PATCH /auth/me` | `{ fullName, phone, avatarUrl }` |
| `changePassword(payload, lang)` | `POST /auth/change-password` | `{ oldPassword, newPassword }` |
| `setPassword(newPassword, lang)` | `POST /auth/set-password` | `{ newPassword }` |
| `logout(lang)` | `POST /auth/logout` | Tự dùng `{ refreshToken }`, rồi xóa token local |

`login`, `refreshToken` và `exchangeOAuthCode` tự lưu access/refresh token từ `response.data`.

### Người dùng — `userService.js`

| Hàm | Endpoint | Payload |
| --- | --- | --- |
| `getUsers(params)` / `useGetUsersQuery(params)` | `GET /admin/users` | Query: `page`, `limit`, `lang` |
| `createUser(payload, lang)` | `POST /admin/users` | `{ email, password, fullName, phone, roleCode }` |
| `getUserById(userId, lang)` | `GET /admin/users/:userId` | — |
| `updateUserRole(userId, roleCode, lang)` | `PATCH /admin/users/:userId/role` | `{ roleCode }` |
| `updateUserActive(userId, isActive, lang)` | `PATCH /admin/users/:userId/active` | `{ isActive }` |
| `resetUserPassword(userId, newPassword, lang)` | `POST /admin/users/:userId/reset-password` | `{ newPassword }` |
| `deleteUser(userId, lang)` | `DELETE /admin/users/:userId` | — |

### Thông báo REST — `notificationService.js`

| Hàm | Endpoint | Payload |
| --- | --- | --- |
| `getNotifications(params)` / `useGetNotificationsQuery(params)` | `GET /notifications` | Query: `page`, `limit`, `onlyUnread`, `lang` |
| `getUnreadCount(lang)` / `useGetUnreadCountQuery()` | `GET /notifications/unread-count` | — |
| `markAllNotificationsAsRead(lang)` | `PATCH /notifications/read-all` | — |
| `markNotificationAsRead(id, lang)` | `PATCH /notifications/:id/read` | — |
| `deleteNotification(id, lang)` | `DELETE /notifications/:id` | — |
| `registerNotificationDevice(payload, lang)` | `POST /notifications/devices` | `{ token, platform, deviceInfo }` |
| `unregisterNotificationDevice(token, lang)` | `DELETE /notifications/devices` | `{ token }` |
| `sendNotification(payload, lang)` | `POST /notifications/send` | `target`, `userId`/`roleCode`, `channel`, `type`, `title`, `body`, `data` |

`target` hợp lệ theo collection: `user`, `role`, hoặc `all`.

### WebSocket thông báo — `realtimeNotificationService.js`

`useNotificationWebSocket` là hook dùng chung cho thông báo hệ thống và remote sensing. Hook tự lấy role từ `useAuthStore` để subscribe `role_{roleCode}`; màn hình có thể truyền thêm `channels`.

```jsx
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationWebSocket } from "@/hooks/useNotificationWebSocket";
import {
  getRemoteSensingChannel,
  REMOTE_SENSING_WS_EVENTS,
} from "@/services/remoteSensingService";

function RemoteSensingJobWatcher({ imageId }) {
  const queryClient = useQueryClient();

  const handleMessage = useCallback((message) => {
    if (message.event === REMOTE_SENSING_WS_EVENTS.STATISTICS_READY) {
      queryClient.setQueryData(
        ["remote-sensing", "images", imageId, "statistics"],
        { data: message.data },
      );
    }

    if (message.event === REMOTE_SENSING_WS_EVENTS.JOB_COMPLETED) {
      queryClient.invalidateQueries({ queryKey: ["remote-sensing", "images", imageId] });
      queryClient.invalidateQueries({ queryKey: ["remote-sensing", "images", imageId, "cog-url"] });
    }
  }, [imageId, queryClient]);

  useNotificationWebSocket({
    enabled: Boolean(imageId),
    channels: [getRemoteSensingChannel(imageId)],
    onMessage: handleMessage,
  });

  return null;
}
```

Các event remote sensing theo Postman + worker:

| Event | Ý nghĩa | Payload |
| --- | --- | --- |
| `remote_sensing:statistics_ready` | Band stats đã tính xong, phát trước `job_completed` | `{ imageId, bandCount, statistics: [{ bandIndex, min, max, mean, std }] }` |
| `remote_sensing:job_completed` | Pipeline xong hoàn toàn, COG sẵn sàng cho WebGIS | `{ jobId, imageId, imageName, status, bandCount, processedAt }` |
| `remote_sensing:job_failed` | Job thất bại sau hết retry | `{ jobId, imageId, status, errorMessage }` |

`NotificationMenu` vẫn chỉ xử lý event `{ event: "notification", data }`, invalidate query `notifications` và dùng REST polling 30 giây làm dự phòng khi WebSocket gián đoạn.

### Tin tức và bình luận — `newsService.js`, `commentsService.js`

| Hàm | Endpoint | Payload |
| --- | --- | --- |
| `getAllNews(params)` / `useGetAllNewsQuery(params)` | `GET /news` | Query mặc định `page=1`, `limit=20`, `lang=vi`, `sortBy=published_at`, `sortOrder=DESC` |
| `getNewsDetailBySlug(slug, lang)` | `GET /news/:slug` | — |
| `getAdminNewsDetail(id, lang)` | `GET /admin/news/:id` | — |
| `createNews(formData, lang)` | `POST /admin/news` | FormData: `lang`, `title`, `summary`, `content`, `status`, `cover` |
| `updateNews(id, payload, lang)` | `PATCH /admin/news/:id` | Ví dụ `{ status, expectedUpdatedAt }` |
| `replaceNews(id, payload, lang)` | `PUT /admin/news/:id` | `{ status, expectedUpdatedAt, translations: { vi, en } }` |
| `deleteNews(id, lang)` | `DELETE /admin/news/:id` | — |
| `getNewsComments(newsId, params)` | `GET /news/:newsId/comments` | Query: `page`, `limit`, `lang` |
| `createNewsComment(newsId, content, lang)` | `POST /news/:newsId/comments` | `{ content }` |
| `approveComment(id, isApproved, lang)` | `PATCH /admin/comments/:id/approve` | `{ isApproved }` |
| `deleteComment(id, lang)` | `DELETE /admin/comments/:id` | — |

Ví dụ upload news:

```js
const formData = new FormData();
formData.append("lang", "vi");
formData.append("title", "Tin mới");
formData.append("summary", "Tóm tắt");
formData.append("content", "<p>Nội dung</p>");
formData.append("status", "draft");
formData.append("cover", selectedFile);
await createNews(formData);
```

### Tài liệu — `documentsService.js`

| Hàm | Endpoint | Payload |
| --- | --- | --- |
| `getAllDocuments(params)` / `useGetAllDocumentsQuery(params)` | `GET /documents` | Query: `page`, `limit`, `lang`, `docType` |
| `getDocumentDetail(id, lang)` | `GET /documents/:id` | — |
| `getAdminDocumentDetail(id, lang)` | `GET /admin/documents/:id` | — |
| `createDocument(formData, lang)` | `POST /admin/documents` | FormData: `lang`, `title`, `description`, `docType`, `isPublic`, `file` |
| `updateDocument(id, payload, lang)` | `PATCH /admin/documents/:id` | Ví dụ `{ isPublic, expectedUpdatedAt }` |
| `replaceDocument(id, payload, lang)` | `PUT /admin/documents/:id` | `{ docType, isPublic, expectedUpdatedAt, translations }` |
| `deleteDocument(id, lang)` | `DELETE /admin/documents/:id` | — |

### Bản đồ PDF — `pdfMapsService.js`

| Hàm | Endpoint | Payload |
| --- | --- | --- |
| `getPdfMaps(params)` / `useGetPdfMapsQuery(params)` | `GET /pdf-maps` | Query: `page`, `limit`, `lang`, `theme`, `yearFrom`, `yearTo` |
| `getPdfMapDetail(id, lang)` | `GET /pdf-maps/:id` | — |
| `getAdminPdfMaps(params)` | `GET /admin/pdf-maps` | Query: `page`, `limit`, `lang` |
| `getAdminPdfMapDetail(id)` | `GET /admin/pdf-maps/:id` | — |
| `createPdfMap(formData, lang)` | `POST /admin/pdf-maps` | FormData: `file`, `thumbnail`, `themeCode`, `year`, `scale`, `region`, `lang`, `title`, `description`, `isPublic` |
| `replacePdfMap(id, payload, lang)` | `PUT /admin/pdf-maps/:id` | `{ themeCode, year, scale, region, thumbnailUrl, isPublic, expectedUpdatedAt, translations }` |
| `upsertPdfMapEnglishTranslation(id, payload)` | `PUT /admin/pdf-maps/:id/translations/en` | `{ title, description }` |
| `deletePdfMap(id, lang)` | `DELETE /admin/pdf-maps/:id` | — |

### Map/GeoServer — `mapLayersService.js`

| Hàm | Endpoint | Payload |
| --- | --- | --- |
| `getMapLayers()` / `useGetMapLayersQuery()` | `GET /map/layers` | — |
| `getMapLayer(code)` | `GET /map/layers/:code` | — |
| `createMapLayer(payload)` | `POST /map/layers` | `{ code, name_vi, table_name, schema_name, geometry_type, epsg_code, category, layer_kind, is_active, is_public, is_editable }` |
| `updateMapLayer(code, payload)` | `PATCH /map/layers/:code` | Ví dụ `{ name_vi, is_public, category, sort_order }` |
| `deleteMapLayer(code)` | `DELETE /map/layers/:code` | — |
| `publishMapLayer(code)` / `unpublishMapLayer(code)` | `POST` / `DELETE /map/layers/:code/publish` | — |
| `updateMapLayerActive(code, isActive)` | `PATCH /map/layers/:code/active` | `{ is_active }` |
| `importMapLayerFile(formData)` | `POST /map/layers/import-file` | FormData: `file`, `code`, `name_vi`, `source_format`, `import_mode`, `srid_input`, `source_layer_name`, `category`, `layer_kind`, `is_public`, `auto_publish` |
| `importMapLayerGeoJson(code, payload)` | `POST /map/layers/:code/import` | `{ source_format, import_mode, auto_publish, geojson }` |
| `getMapLayerImportJobs(code)` | `GET /map/layers/:code/import-jobs` | — |
| `getMapImportJob(id)` | `GET /map/import-jobs/:id` | — |
| `harvestRaster(store, payload)` | `POST /map/rasters/:store/harvest` | `{ tif_path, geoserver_layer, truncate_cache }` |

### Viễn thám — `remoteSensingService.js`

```js
import {
  REMOTE_SENSING_WS_EVENTS,
  getRemoteSensingChannel,
  isRemoteSensingWebSocketEvent,
  getRemoteSensingImages,
  useGetRemoteSensingImagesQuery,
  useGetRemoteSensingImageQuery,
  useGetRemoteSensingImageStatisticsQuery,
  useGetRemoteSensingCogUrlQuery,
} from "@/services/remoteSensingService";
```

| Hàm | Endpoint | Payload |
| --- | --- | --- |
| `getRemoteSensingImages(params)` / `useGetRemoteSensingImagesQuery(params)` | `GET /remote-sensing/images` | Query mặc định `page=1`, `limit=10`, `lang=vi` |
| `getRemoteSensingImage(id, lang)` / `useGetRemoteSensingImageQuery(id)` | `GET /remote-sensing/images/:id` | — |
| `getRemoteSensingImageStatistics(id, lang)` / `useGetRemoteSensingImageStatisticsQuery(id)` | `GET /remote-sensing/images/:id/statistics` | HTTP fallback khi không dùng WS |
| `getRemoteSensingCogUrl(id, lang)` / `useGetRemoteSensingCogUrlQuery(id)` | `GET /remote-sensing/images/:id/cog-url` | Dùng sau `job_completed` |
| `getRemoteSensingLayers(params)` / `useGetRemoteSensingLayersQuery(params)` | `GET /remote-sensing/layers` | Query: `satellite`, `image_type`, `province_code`, `bbox`, `limit`, `lang` |
| `getRemoteSensingUploadUrl(fileName, lang)` | `GET /remote-sensing/upload-url` | Query `{ file_name, lang }` |
| `uploadRemoteSensingImage(formData, lang)` | `POST /remote-sensing/images` | FormData: `raster_file`, `thumbnail?`, `name`, `satellite`, `image_type`, `acquisition_date`, `bbox`, `is_public` |
| `updateRemoteSensingImage(id, payload, lang)` | `PATCH /remote-sensing/images/:id` | Ví dụ `{ name, is_public, expectedUpdatedAt }` |
| `getRemoteSensingDownloadUrl(id, fileId, lang)` | `GET /remote-sensing/images/:id/download` | Service gửi `file_id` để khớp route backend hiện tại |
| `processRemoteSensingImage(id, payload, lang)` | `POST /remote-sensing/images/:id/process` | Mặc định `{ job_type: "full_pipeline", priority: 5 }` |
| `deleteRemoteSensingImage(id, hardDelete, lang)` | `DELETE /remote-sensing/images/:id` | Service gửi `hard_delete` để khớp route backend hiện tại |

Luồng UI khuyến nghị sau upload/process:

1. Subscribe `getRemoteSensingChannel(imageId)`.
2. Khi nhận `REMOTE_SENSING_WS_EVENTS.STATISTICS_READY`, cập nhật bảng thống kê band ngay từ payload hoặc refetch `/statistics`.
3. Khi nhận `REMOTE_SENSING_WS_EVENTS.JOB_COMPLETED`, refetch detail ảnh và COG URL, sau đó bật hành động "Xem trên bản đồ".
4. Khi nhận `REMOTE_SENSING_WS_EVENTS.JOB_FAILED`, hiển thị `errorMessage` và giữ lựa chọn chạy lại nếu role có quyền.

## 4. Quy tắc upload và optimistic concurrency

- Truyền thẳng `FormData` vào hàm create/import/upload; không tự set header `Content-Type`, browser sẽ gắn multipart boundary.
- Với `PUT`/`PATCH` có `expectedUpdatedAt`, gọi detail trước rồi gửi lại đúng `updatedAt` server trả về. Khi backend báo conflict, tải lại detail và yêu cầu người dùng xác nhận thay đổi.
- Không gửi password, token OAuth, access token hay thông tin nhạy cảm vào log/toast.
- Luôn truyền `lang` khi màn hình hỗ trợ đổi ngôn ngữ; mặc định service là `vi`.
- Không sửa Postman collection hoặc `imageProcessing.worker.js` khi chỉ cập nhật client service/docs; hai file đó đang là source of truth của contract remote sensing.
