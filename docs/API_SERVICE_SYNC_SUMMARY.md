# Đồng bộ service client với Postman collection

## Nguồn chuẩn

- REST/WebSocket contract: [`server/postman/Kontum-API.postman_collection.json`](../../server/postman/Kontum-API.postman_collection.json)
- Payload WebSocket remote sensing thực tế: [`server/src/workers/imageProcessing.worker.js`](../../server/src/workers/imageProcessing.worker.js)
- Base URL browser: `VITE_BASE_URL_BE` phải trỏ tới base API đã có `/api/v1`
- WebSocket URL browser: `VITE_WS_URL` trỏ tới host backend; client tự nối `/ws?token=<accessToken>`
- HTTP client chung: [`src/services/apiClient/`](../src/services/apiClient/)

Không sửa Postman collection hoặc worker khi chỉ đồng bộ service client. Nếu Postman/worker thay đổi, cập nhật service và docs theo hai nguồn này trước khi dùng endpoint mới ở UI.

## Thay đổi đã thực hiện

- Sửa route người dùng từ `/users/admin` thành `/admin/users`.
- Sửa route quản trị tin tức từ `/news/admin/*` thành `/admin/news/*`.
- Sửa route quản trị tài liệu từ `/documents/admin/*` thành `/admin/documents/*`.
- Đổi sort mặc định của danh sách tin tức thành `published_at DESC`, đúng collection.
- Thay các API upsert translation cũ không có trong collection của news/documents bằng thao tác `PUT` gộp đúng contract.
- Thêm service cho comments, PDF maps, map/GeoServer và remote sensing.
- Bổ sung remote sensing WebSocket helper theo Postman + worker:
  - `remote_sensing:statistics_ready` phát ngay khi band statistics tính xong.
  - `remote_sensing:job_completed` phát sau khi pipeline hoàn tất và COG sẵn sàng.
  - `remote_sensing:job_failed` dùng field lỗi thống nhất `errorMessage`.
- `useNotificationWebSocket` hỗ trợ subscribe thêm channel, ví dụ `remote_sensing:1`, ngoài các channel thông báo chung.

## Đối chiếu service hiện có

| Service client | Nhóm trong Postman | Endpoint/contract được bao phủ | Trạng thái |
| --- | --- | --- | --- |
| [`authService.js`](../src/services/authService.js) | Xác thực | register, login, refresh, password, email verification, Google OAuth, profile, logout | Khớp |
| [`userService.js`](../src/services/userService.js) | Người dùng | CRUD người dùng, role, active, reset password | Khớp route `/admin/users` |
| [`notificationService.js`](../src/services/notificationService.js) | Thông báo REST | list, unread count, read, device token, send | Khớp |
| [`realtimeNotificationService.js`](../src/services/realtimeNotificationService.js) | Thông báo realtime | WebSocket `/ws`, subscribe `all`, `role_{roleCode}`, `remote_sensing:{imageId}` | Khớp Postman WS |
| [`newsService.js`](../src/services/newsService.js) | Tin tức | public list/detail; admin detail, create, patch, put, delete | Khớp route `/admin/news` |
| [`commentsService.js`](../src/services/commentsService.js) | Tin tức | list/create comments, approve, delete | Khớp |
| [`documentsService.js`](../src/services/documentsService.js) | Báo cáo/Văn bản | public/admin detail, upload, patch, put, delete | Khớp route `/admin/documents` |
| [`pdfMapsService.js`](../src/services/pdfMapsService.js) | Bản đồ PDF | public/admin list/detail, upload, update, translation, delete | Khớp |
| [`mapLayersService.js`](../src/services/mapLayersService.js) | Bản đồ/GeoServer | layer CRUD, publish, import, import jobs, raster harvest | Khớp |
| [`remoteSensingService.js`](../src/services/remoteSensingService.js) | Viễn thám | image list/detail/stats/COG/upload/process/download/delete, WS constants/channel helper | Đã bổ sung |
| [`apiClient/`](../src/services/apiClient/) | Hạ tầng client | URL, auth header, refresh token, parse error/response, TanStack Query helper | Dùng chung |

## Endpoint theo service

### `authService.js`

| Method | Endpoint |
| --- | --- |
| POST | `/auth/register`, `/auth/login`, `/auth/refresh` |
| POST | `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/auth/resend-verification` |
| GET/POST | `/auth/google`, `/auth/google/mobile`, `/auth/oauth/exchange` |
| GET/PATCH | `/auth/me` |
| POST | `/auth/change-password`, `/auth/set-password`, `/auth/logout` |

### Nội dung, người dùng và thông báo

| Service | Method | Endpoint |
| --- | --- | --- |
| `userService` | GET/POST | `/admin/users` |
| `userService` | GET/PATCH/DELETE | `/admin/users/:userId` |
| `userService` | PATCH/POST | `/admin/users/:userId/role`, `/admin/users/:userId/active`, `/admin/users/:userId/reset-password` |
| `notificationService` | GET | `/notifications`, `/notifications/unread-count` |
| `notificationService` | PATCH/DELETE | `/notifications/read-all`, `/notifications/:id/read`, `/notifications/:id` |
| `notificationService` | POST/DELETE | `/notifications/devices`, `/notifications/send` |
| `newsService` | GET | `/news`, `/news/:slug`, `/admin/news/:id` |
| `newsService` | POST/PATCH/PUT/DELETE | `/admin/news`, `/admin/news/:id` |
| `commentsService` | GET/POST | `/news/:newsId/comments` |
| `commentsService` | PATCH/DELETE | `/admin/comments/:commentId/approve`, `/admin/comments/:commentId` |
| `documentsService` | GET | `/documents`, `/documents/:id`, `/admin/documents/:id` |
| `documentsService` | POST/PATCH/PUT/DELETE | `/admin/documents`, `/admin/documents/:id` |

### Bản đồ và viễn thám

| Service | Method | Endpoint |
| --- | --- | --- |
| `pdfMapsService` | GET | `/pdf-maps`, `/pdf-maps/:id`, `/admin/pdf-maps`, `/admin/pdf-maps/:id` |
| `pdfMapsService` | POST/PUT/DELETE | `/admin/pdf-maps`, `/admin/pdf-maps/:id`, `/admin/pdf-maps/:id/translations/en` |
| `mapLayersService` | GET/POST | `/map/layers` |
| `mapLayersService` | GET/PATCH/DELETE | `/map/layers/:code` |
| `mapLayersService` | POST/DELETE/PATCH | `/map/layers/:code/publish`, `/map/layers/:code/active` |
| `mapLayersService` | POST/GET | `/map/layers/import-file`, `/map/layers/:code/import`, `/map/layers/:code/import-jobs`, `/map/import-jobs/:id`, `/map/rasters/:store/harvest` |
| `remoteSensingService` | GET | `/remote-sensing/images`, `/remote-sensing/images/:id`, `/remote-sensing/images/:id/statistics`, `/remote-sensing/images/:id/cog-url`, `/remote-sensing/layers`, `/remote-sensing/upload-url`, `/remote-sensing/images/:id/download` |
| `remoteSensingService` | POST/PATCH/DELETE | `/remote-sensing/images`, `/remote-sensing/images/:id`, `/remote-sensing/images/:id/process` |

## WebSocket remote sensing

Kênh cần subscribe theo ảnh:

```json
{
  "action": "subscribe",
  "channels": ["remote_sensing:1"]
}
```

Các event server phát cho một job:

| Event | Khi nào phát | Payload chính |
| --- | --- | --- |
| `remote_sensing:statistics_ready` | Ngay sau khi tính xong thống kê band, trước `job_completed` | `imageId`, `bandCount`, `statistics[{ bandIndex, min, max, mean, std }]` |
| `remote_sensing:job_completed` | Pipeline hoàn tất, COG sẵn sàng | `jobId`, `imageId`, `imageName`, `status`, `bandCount`, `processedAt` |
| `remote_sensing:job_failed` | Job thất bại vĩnh viễn sau retry | `jobId`, `imageId`, `status`, `errorMessage` |

Sau `statistics_ready`, UI có thể hiển thị bảng band stats ngay. Sau `job_completed`, UI nên refetch `GET /remote-sensing/images/:id` và `GET /remote-sensing/images/:id/cog-url` để lấy thumbnail/COG mới.

## Quy ước cần giữ

- `fetcher()` dành cho `GET`; `mutater(endpoint, method, payload)` dành cho mutation.
- `mutater` tự JSON stringify object và tự bỏ `Content-Type` khi payload là `FormData`.
- Access token được thêm tự động vào request không thuộc public auth endpoint. Khi `401`, client refresh một lần rồi retry request.
- List service đặt default pagination theo collection: news/documents/PDF/users/notifications là `page=1&limit=20`; remote sensing images là `page=1&limit=10`.
- API mutation có cập nhật đồng thời phải chuyển `expectedUpdatedAt` lấy từ API detail; không tự sinh giá trị đó ở client.
- Upload dùng đúng field name trong collection: `cover`, `file`, `thumbnail`, `raster_file` hoặc `file` GIS tùy endpoint.
- Remote sensing download/delete hiện service dùng `file_id` và `hard_delete` để khớp route backend đang chạy; Postman mô tả `fileId`/`hardDelete`, nên cần đồng bộ lại backend hoặc collection nếu contract chính thức đổi.

Chi tiết hàm, payload và ví dụ import nằm trong [Hướng dẫn sử dụng service](./CLIENT_SERVICE_GUIDE.md).
