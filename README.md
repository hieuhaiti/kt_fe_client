# WebGIS Kon Tum - Client

Ứng dụng WebGIS công khai dành cho người dân và người dùng cuối tỉnh Kon Tum. Trải nghiệm trung tâm là bản đồ tương tác phục vụ tra cứu tài nguyên rừng, môi trường, ảnh vệ tinh, thời tiết, cảnh báo cháy rừng và phản ánh hiện trường.

Đây không phải cổng quản trị. Các quy trình quản trị hệ thống, dữ liệu và nghiệp vụ chuyên sâu được triển khai trong thư mục `admin/`.

## Phạm vi chức năng

- Hiển thị bản đồ nền và các lớp dữ liệu chuyên đề.
- Tra cứu, tìm kiếm và xem thông tin đối tượng trên bản đồ.
- Theo dõi thời tiết, chất lượng không khí và các lớp dữ liệu khí tượng.
- Xem, cấu hình và so sánh ảnh vệ tinh.
- Theo dõi nguy cơ cháy rừng và điểm cháy thực tế khi API tương ứng được cung cấp.
- Đọc tin tức, văn bản và báo cáo công khai.
- Gửi phản ánh hiện trường kèm vị trí, mô tả và hình ảnh.
- Đăng ký, đăng nhập, quản lý hồ sơ và theo dõi phản ánh đã gửi.

Một số module trong tài liệu nghiệp vụ là phạm vi mục tiêu và có thể chưa được backend hiện thực đầy đủ. Trước khi đấu nối chức năng mới, cần kiểm tra route thực tế trong `server/src/routes/`.

## Công nghệ

| Nhóm | Công nghệ |
|---|---|
| Giao diện | React 19, JavaScript/JSX, Vite 7 |
| CSS | Tailwind CSS 4, Radix UI |
| Bản đồ | Mapbox GL JS, Mapbox GL Draw, Turf.js |
| Server state | TanStack Query |
| UI state | Zustand |
| Form | React Hook Form, Zod |
| Routing | React Router |
| Chuyển động | Motion |
| Xuất bản đồ | jsPDF, html2canvas, `@watergis/mapbox-gl-export` |

## Yêu cầu môi trường

- Node.js `20.19+` hoặc `22.12+`.
- npm tương thích với phiên bản Node.js đang sử dụng.
- Mapbox access token.
- URL API backend và các API key thời tiết cần thiết cho môi trường chạy.

## Cài đặt và chạy

Thực hiện các lệnh từ thư mục `client/`:

```bash
npm install
npm run dev
```

Vite mặc định phục vụ ứng dụng tại `http://localhost:5173`.

Các script hiện có:

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Biến môi trường

Tạo file `.env` trong `client/`. Không commit token hoặc API key thật.

```env
# Backend và tài nguyên tĩnh
VITE_BASE_URL_BE=http://localhost:8881/api/v1
VITE_BASE_URL=http://localhost:8881
VITE_WS_URL=ws://localhost:8881

# Mapbox
VITE_MAPBOX_TOKEN=
VITE_MAPBOX_STYLE_Outdoor=
VITE_MAPBOX_STYLE_Street=
VITE_MAPBOX_STYLE_Satellite=
VITE_MAPBOX_STYLE_Satellite_Street=

# Thời tiết và lớp phủ khí tượng
VITE_OPENWEATHER_API_KEY=
VITE_OPENWEATHER_URL_BASE=
VITE_OPENWEATHER_LAYER_URL_BASE=
VITE_WEATHERAPI_API_KEY=
VITE_WEATHERAPI_URL_BASE=
VITE_WINDY_API_KEY=

# Tìm kiếm địa điểm nếu được sử dụng
VITE_TOMTOM_API_KEY=
VITE_TOMTOM_URL_BASE=
```

`VITE_BASE_URL_BE` phải trỏ đến base API `/api/v1`. Mọi biến đưa xuống trình duyệt đều là dữ liệu công khai; không đặt service-account key, credential GeoServer hoặc secret backend trong `VITE_*`.

## Cấu trúc chính

```text
src/
├── components/
│   ├── Map/              # Bản đồ, sidebar và công cụ nổi
│   ├── common/           # Thành phần dùng chung
│   ├── feedback/         # Phản ánh hiện trường
│   ├── news/             # Bình luận và thành phần tin tức
│   └── ui/               # Thành phần UI nền tảng
├── constant/             # Cấu hình hiển thị và endpoint
├── helper/Map/           # Helper và overlay bản đồ
├── hooks/                # React hooks
├── layout/               # Layout bản đồ, nội dung và hồ sơ
├── lib/                  # Tiện ích và token manager
├── pages/                # Các trang theo route
├── services/             # API service và TanStack Query hooks
├── stores/               # Zustand stores
└── theme/                # Token theme và Tailwind base
```

Alias `@/` trỏ đến `client/src`.

## Quy ước phát triển

- Giữ `client/` ở JavaScript/JSX và dùng React functional component.
- Dùng TanStack Query cho server state, Zustand cho UI state.
- Đặt API service trong `src/services/`; dùng `fetcher`, `mutater`, `useApiQuery` và `useApiMutation` theo pattern hiện có.
- Dùng token semantic trong `src/theme/theme.css`; không hardcode màu UI nếu đã có token phù hợp.
- Ưu tiên component trong `src/components/ui/` và icon từ `lucide-react`.
- Thiết kế mobile-first nhưng luôn giữ diện tích bản đồ hữu dụng.
- Cleanup Mapbox source, layer, event, marker, popup và overlay trong `useEffect`.
- Không render số lượng lớn DOM marker; dùng source/layer hoặc clustering.

## Nguồn tài liệu

Thứ tự tham chiếu khi phát triển:

1. `../docs/` cho nghiệp vụ, vai trò và sản phẩm dữ liệu mục tiêu.
2. `../server/docs/` cho kiến trúc, API, PostGIS, GeoServer, fire-risk, weather, satellite và MobileGIS.
3. `src/` cho hành vi thực tế đang chạy.
4. `package.json` cho dependency và script khả dụng.

Các tài liệu kỹ thuật nên đọc trước khi triển khai module mới:

- `../server/docs/architecture/04-system-architecture.md`
- `../server/docs/architecture/06-api-design.md`
- `../server/docs/modules/07-fire-risk-design.md`
- `../server/docs/modules/08-weather-satellite-design.md`
- `../server/docs/modules/09-mobilegis-design.md`
- `../server/docs/modules/12-geoserver-integration-design.md`
- `../server/docs/14-functional-spec-detailed.md`

## Kiểm tra trước khi bàn giao

Tối thiểu chạy:

```bash
npm run lint
npm run build
```

Đồng thời kiểm tra các trạng thái loading, empty, error, offline/degraded và khả năng điều hướng bằng bàn phím cho phần giao diện đã thay đổi.
