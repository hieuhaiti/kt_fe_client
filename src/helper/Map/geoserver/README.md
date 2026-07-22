# GeoServer Pipeline tren WebGIS client

Tai lieu nay mo ta luong du lieu tu backend/GeoServer den hien thi tren Mapbox trong `client/`, dong thoi giai thich vai tro cua tung dinh dang OGC dang duoc cau hinh: WMS, WFS, WCS, WMTS, TMS va WMS-C.

## 1. Muc tieu tich hop

GeoServer duoc dung nhu map service cho cac lop du lieu chuyen de cua Kon Tum. Client khong hardcode tung URL layer, ma lay metadata layer tu backend, sau do build URL OGC theo cau hinh moi truong.

Bien moi truong phia client:

```env
VITE_GEOSERVER_URL=https://geoserver.humgsoftware.pro.vn/geoserver/kontum/wms
```

URL nay co the tro den:

- Root GeoServer: `https://geoserver.humgsoftware.pro.vn/geoserver`
- Workspace: `https://geoserver.humgsoftware.pro.vn/geoserver/kontum`
- Endpoint service cu the: `https://geoserver.humgsoftware.pro.vn/geoserver/kontum/wms`

Helper `buildGeoServerWorkspaceUrl()` se chuan hoa lai endpoint theo service can dung. Vi du neu env dang la `/kontum/wms` thi khi goi WFS, URL se duoc doi thanh `/kontum/wfs`, khong noi sai thanh `/kontum/wms/kontum/wfs`.

## 2. Cac file lien quan

- `client/src/constant/geoserverData.js`: khai bao service type, version, output format, thu tu layer va paint cho point/cluster.
- `client/src/helper/Map/geoserver/common.js`: helper chung de chuan hoa URL, lay workspace, lay ten layer, tao source/layer id va xac dinh geometry priority.
- `client/src/helper/Map/geoserver/wms.js`: build WMS GetMap tile URL va WMS GetFeatureInfo URL.
- `client/src/helper/Map/geoserver/wfs.js`: build WFS GetFeature URL va fetch GeoJSON.
- `client/src/helper/Map/geoserver/wcs.js`: build WCS GetCoverage URL.
- `client/src/helper/Map/geoserver/wmts.js`: build WMTS GetTile URL.
- `client/src/helper/Map/geoserver/tms.js`: build TMS tile URL.
- `client/src/helper/Map/geoserver/wmsc.js`: build WMS-C tiled GetMap URL.
- `client/src/helper/Map/MapHelper.js`: noi helper GeoServer voi Mapbox source/layer.
- `client/src/components/Map/MapComponent.jsx`: dong bo state layer len map va xu ly click identify.
- `client/src/components/Map/Sidebar/elements/Datalyer/LayerSelection.jsx`: UI bat/tat lop du lieu.
- `client/src/stores/Map/Sidebar/useDataLayerStore.js`: luu danh sach layer va trang thai enabled.
- `client/src/stores/Map/useMapStore.js`: luu cac layer dang duoc hien thi tren map.

## 3. Pipeline tong quat

### Buoc 1: Backend tra danh sach layer

`LayerSelection.jsx` goi `useGetMapLayersQuery()` de lay danh sach layer tu backend. Moi layer can co cac truong quan trong:

```js
{
  code: "uy_ban_nhan_dan",
  name_vi: "Uy ban nhan dan",
  geometry_type: "POINT",
  geoserver_layer: "kontum:UyBanNhanDan",
  table_name: "uy_ban_nhan_dan",
  min_zoom: 0,
  max_zoom: 22,
  default_style: { visible_by_default: false, opacity: 0.72 },
  is_active: true,
  is_public: true
}
```

Client chi dua vao danh sach layer co `is_active` va `geoserver_layer`.

### Buoc 2: UI chuyen metadata vao data layer store

`LayerSelection.jsx` goi:

```js
setOgcLayerState(mapLayers);
```

`useDataLayerStore.setOgcLayerState()` normalize metadata thanh state noi bo:

- `id`: uu tien `code`, fallback `id`.
- `name`: uu tien `name_vi`, `name_en`, `name`, `code`.
- `geometry_type`: dung de quyet dinh cach render.
- `geoserver_layer`: ten layer day du trong GeoServer, vi du `kontum:AoHo`.
- `enabled`: giu trang thai bat/tat hien tai neu layer da ton tai, tranh refresh API lam reset layer.

### Buoc 3: Bat/tat layer day sang map store

Moi item trong `LayerSelection.jsx` co effect rieng:

- Neu `layer.enabled === true`: goi `useMapStore.setOgcLayerData(sourceId, layer)`.
- Neu tu true sang false: goi `useMapStore.removeOgcLayerData(sourceId)`.

`sourceId` duoc tao bang:

```js
buildOgcSourceId(layer)
```

Vi du:

```txt
ogc-src-uy_ban_nhan_dan
ogc-src-aoho
```

### Buoc 4: MapComponent dong bo state len Mapbox

`MapComponent.jsx` lang nghe `ogcLayersData`.

Voi moi layer dang bat:

```js
addOrUpdateGeoServerLayer(map, sourceId, layer, true);
```

Voi layer bi tat:

```js
removeGeoServerLayer(map, sourceId);
```

Ham nay duoc ap dung cho ca map don va split map.

### Buoc 5: MapHelper chon cach visual theo geometry

`addOrUpdateGeoServerLayer()` trong `MapHelper.js` phan nhanh:

- `POINT` hoac `MULTIPOINT`: dung WFS de lay GeoJSON, sau do ve point/cluster bang Mapbox vector layer.
- `LINESTRING`, `MULTILINESTRING`, `POLYGON`, `MULTIPOLYGON`: dung WMS raster tile.

Ly do:

- Point can tuong tac truc tiep, cluster, hover/click tot. WFS GeoJSON phu hop hon.
- Vung/duong co the nhieu doi tuong va style nam ben GeoServer. WMS tile nhe hon cho render nen ban do it bi qua tai.

### Buoc 6: Thu tu layer tren ban do

Thu tu render OGC layer:

```txt
polygon/vung -> line/duong -> point/diem
```

Priority nam trong `GEOSERVER_LAYER_ORDER_PRIORITY`:

```js
POLYGON: 0
LINE: 1
POINT: 2
```

MapHelper gan metadata `ktGeometryPriority` vao Mapbox layer. Khi them/cap nhat layer, helper tim layer co priority cao hon de chen `beforeId`, dam bao vung nam duoi, duong nam giua, diem nam tren.

## 4. WMS - Web Map Service

### Phien ban

Ho tro:

```txt
WMS: 1.3.0, 1.1.1
Default: 1.3.0
```

### Muc dich

WMS tra ve anh ban do da render san tu GeoServer. Client khong nhan feature geometry, ma nhan tile anh PNG. Phu hop voi:

- Lop vung lon.
- Lop duong nhieu feature.
- Lop co style phuc tap da cau hinh trong GeoServer.
- Truong hop can hien thi nhanh, khong can thao tac tung feature tren client.

### URL GetMap dang dung

Helper: `buildWmsTileUrl(layer)`.

Mau URL:

```txt
https://geoserver.humgsoftware.pro.vn/geoserver/kontum/wms
  ?service=WMS
  &version=1.3.0
  &request=GetMap
  &layers=kontum:AoHo
  &styles=
  &width=256
  &height=256
  &crs=EPSG:3857
  &format=image/png
  &transparent=true
  &tiled=true
  &bbox={bbox-epsg-3857}
```

Khac voi URL mau OpenLayers ban dau:

```txt
format=application/openlayers
srs=EPSG:32648
width=451
height=768
```

Client Mapbox khong dung `application/openlayers` de visual layer. Mapbox can tile image, nen dung:

```txt
format=image/png
crs=EPSG:3857
bbox={bbox-epsg-3857}
width=256
height=256
```

### Hien thi tren Mapbox

MapHelper them source:

```js
map.addSource(sourceId, {
  type: "raster",
  tiles: [tileUrl],
  tileSize: 256,
  minzoom,
  maxzoom,
  attribution: "GeoServer"
});
```

Sau do them layer:

```js
map.addLayer({
  id: `ogc-${sourceId}-raster`,
  type: "raster",
  source: sourceId,
  paint: {
    "raster-opacity": opacity,
    "raster-fade-duration": 250
  }
});
```

### Tuong tac click voi WMS

WMS la anh raster, khong co feature truc tiep trong Mapbox. De click vao doi tuong, client goi `GetFeatureInfo`.

Helper: `buildWmsFeatureInfoUrl(map, layer, point)`.

Thong tin can tinh tu map hien tai:

- Bounding box theo `EPSG:3857`.
- Kich thuoc canvas map.
- Toa do pixel click `i`, `j`.
- `query_layers`: layer can identify.
- `info_format=application/json`.

Ket qua GeoServer tra ve GeoJSON-like feature. `MapComponent.jsx` map feature nay vao data modal bang `mapOgcFeatureToModalData()`.

## 5. WFS - Web Feature Service

### Phien ban

Ho tro:

```txt
WFS: 2.0.0, 1.1.0, 1.0.0
Default: 2.0.0
```

### Muc dich

WFS tra ve feature geometry va properties, thuong o dang GeoJSON. Phu hop voi:

- Lop diem can click truc tiep.
- Lop can filter client-side.
- Lop can cluster.
- Lop can truy van thuoc tinh/geometry chi tiet.

Trong client hien tai, WFS dang duoc dung cho cac layer `POINT`/`MULTIPOINT`.

### URL GetFeature dang dung

Helper: `buildWfsFeatureUrl(layer, options)`.

Mau URL:

```txt
https://geoserver.humgsoftware.pro.vn/geoserver/kontum/wfs
  ?service=WFS
  &version=2.0.0
  &request=GetFeature
  &typeNames=kontum:UyBanNhanDan
  &outputFormat=application/json
  &srsName=EPSG:4326
  &count=5000
```

Mac dinh:

- `srsName=EPSG:4326` vi Mapbox GeoJSON source nhan toa do `[lng, lat]`.
- `count=5000` de tranh lay qua nhieu feature trong mot lan.
- Co the truyen `bbox` neu can toi uu theo viewport.

### Hien thi point va cluster

MapHelper them source:

```js
map.addSource(sourceId, {
  type: "geojson",
  data: geojson,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
});
```

Sau do tao 4 layer:

```txt
ogc-{sourceId}-cluster
ogc-{sourceId}-cluster-count
ogc-{sourceId}-point-halo
ogc-{sourceId}-point
```

Paint nam trong `GEOSERVER_POINT_PAINT`:

- Cluster doi mau theo `point_count`.
- Cluster co text dem so diem.
- Point le co halo trang va circle mau rieng.

### Tuong tac click voi WFS point

`MapComponent.jsx` dung:

```js
map.queryRenderedFeatures(event.point, { layers: pointRenderedLayerIds })
```

Neu click vao cluster:

- Lay `cluster_id`.
- Goi `source.getClusterExpansionZoom(clusterId, callback)`.
- `map.easeTo()` zoom vao cum.

Neu click vao point le:

- Lay feature truc tiep tu Mapbox.
- Mo `MapLayerDetailModal`.

## 6. WCS - Web Coverage Service

### Phien ban

Ho tro:

```txt
WCS: 2.0.1
Default: 2.0.1
```

### Muc dich

WCS tra ve coverage/raster data goc, vi du GeoTIFF, grid, DEM, anh phan tich. Khac WMS:

- WMS tra anh da render de xem.
- WCS tra du lieu raster goc de phan tich/tai xuong/xu ly tiep.

WCS phu hop voi:

- Anh ve tinh.
- DEM.
- Raster nguy co chay.
- Raster chi so NDVI/NBR/LST.
- Tai file GeoTIFF de xu ly offline/backend.

### URL GetCoverage

Helper: `buildWcsCoverageUrl(layer, options)`.

Mau URL:

```txt
https://geoserver.humgsoftware.pro.vn/geoserver/kontum/wcs
  ?service=WCS
  &version=2.0.1
  &request=GetCoverage
  &coverageId=kontum:forest_risk
  &format=image/tiff
```

Co the them `subset` de cat theo truc/toa do, tuy theo coverage GeoServer publish.

### Trang thai visual tren client

Client hien tai moi co helper build URL WCS, chua render WCS truc tiep len Mapbox. Neu muon visual coverage:

1. Dung WMS de xem raster coverage da style.
2. Dung WCS de tai/xu ly du lieu goc.
3. Neu can render client-side GeoTIFF, can them pipeline doc GeoTIFF va convert thanh tile/texture, khong nen dua GeoTIFF lon truc tiep vao Mapbox source.

## 7. WMTS - Web Map Tile Service

### Phien ban

Ho tro:

```txt
WMTS: 1.0.0
Default: 1.0.0
```

### Muc dich

WMTS tra tile anh da cat san theo tile matrix set. Phu hop voi:

- Nen tang tile co cache tot.
- Lop raster/vector style da publish qua GeoWebCache.
- Hien thi nhanh hon WMS dong trong nhieu truong hop.

### URL GetTile

Helper: `buildWmtsTileUrl(layer, options)`.

Mau URL:

```txt
https://geoserver.humgsoftware.pro.vn/geoserver/kontum/gwc/service/wmts
  ?service=WMTS
  &version=1.0.0
  &request=GetTile
  &layer=kontum:AoHo
  &style=
  &tilematrixset=EPSG:3857
  &format=image/png
  &tilematrix={z}
  &tilerow={y}
  &tilecol={x}
```

### Trang thai visual tren client

Client hien tai da co helper URL, nhung `addOrUpdateGeoServerLayer()` mac dinh chua chon WMTS. De dung WMTS thay WMS, can them field metadata, vi du:

```js
service_type: "WMTS"
```

Sau do MapHelper co the switch theo `service_type` va them raster source voi `tiles: [buildWmtsTileUrl(layer)]`.

## 8. TMS - Tile Map Service

### Phien ban

Ho tro:

```txt
TMS: 1.0.0
Default: 1.0.0
```

### Muc dich

TMS la dang tile URL theo path. Thuong duoc GeoWebCache cung cap. Phu hop voi:

- Client can URL tile don gian.
- Tile cache san.
- Lop nen/lop anh it thay doi.

### URL tile

Helper: `buildTmsTileUrl(layer, options)`.

Mau URL:

```txt
https://geoserver.humgsoftware.pro.vn/geoserver/kontum/gwc/service/tms/1.0.0/kontum%3AAoHo@EPSG:3857@png/{z}/{x}/{y}.png
```

### Luu y

TMS co the khac quy uoc truc Y voi XYZ tile tuy cau hinh server/client. Neu tile bi lat theo truc doc, can kiem tra scheme cua GeoWebCache va Mapbox.

### Trang thai visual tren client

Client hien tai co helper URL, chua auto render TMS. Cach dau noi tuong tu WMTS: them `service_type: "TMS"` trong metadata layer va switch trong MapHelper.

## 9. WMS-C - Cached WMS

### Phien ban

Ho tro:

```txt
WMS-C: 1.1.1
Default: 1.1.1
```

### Muc dich

WMS-C la cach dung WMS theo tile cache. No gan voi GeoWebCache/Cached WMS. So voi WMS dong:

- Cache tot hon.
- Phu hop layer it thay doi.
- Giam tai cho GeoServer.

### URL GetMap cached

Helper: `buildWmscTileUrl(layer, options)`.

Mau URL:

```txt
https://geoserver.humgsoftware.pro.vn/geoserver/kontum/wms
  ?service=WMS
  &version=1.1.1
  &request=GetMap
  &layers=kontum:AoHo
  &styles=
  &width=256
  &height=256
  &srs=EPSG:3857
  &format=image/png
  &transparent=true
  &tiled=true
  &bbox={bbox-epsg-3857}
```

### Khac WMS 1.3.0

- WMS 1.3.0 dung `crs`.
- WMS 1.1.1/WMS-C dung `srs`.
- WMS-C tap trung vao tile cache nen bat buoc can `tiled=true`, tile size on dinh va CRS/tile grid khop voi cache.

## 10. Identify/click pipeline

Thu tu xu ly click trong `MapComponent.jsx`:

1. Neu dang `clickedPointMode` cho AQI/weather thi bo qua OGC identify.
2. Neu click trung category layer noi bo `cat-*` thi uu tien category, khong goi OGC.
3. Kiem tra OGC point WFS layer:
   - Click cluster: zoom vao cluster.
   - Click point: mo modal chi tiet.
4. Neu khong co point hit, goi WMS GetFeatureInfo cho cac layer vung/duong dang bat.
5. Layer identify duoc sort theo priority:
   - Point cao nhat.
   - Line tiep theo.
   - Polygon sau cung.
   - Neu cung loai, uu tien `sort_order` cao hon.

## 11. Cleanup va cap nhat layer

Khi tat layer, `removeGeoServerLayer()` xoa cac layer theo ca hai kieu:

WMS raster:

```txt
ogc-{sourceId}-raster
```

WFS point:

```txt
ogc-{sourceId}-point
ogc-{sourceId}-point-halo
ogc-{sourceId}-cluster-count
ogc-{sourceId}-cluster
```

Sau do xoa source Mapbox neu ton tai.

Khi layer van dang bat va metadata cap nhat:

- WMS: giu source/layer neu da co, cap nhat visibility/opacity va move layer dung thu tu.
- WFS point: fetch lai GeoJSON va `source.setData(geojson)`, khong remove/add source neu khong can thiet.

Day la diem quan trong de giam hien tuong layer nhay do bi ve lai.

## 12. Khi nao dung dinh dang nao

| Dinh dang | Du lieu tra ve | Dung tot cho | Tuong tac feature | Trang thai trong client |
| --- | --- | --- | --- | --- |
| WMS | Anh ban do | Vung/duong/lop style phuc tap | Qua GetFeatureInfo | Dang render mac dinh cho non-point |
| WFS | Feature GeoJSON | Diem, cluster, truy van thuoc tinh | Truc tiep tren Mapbox | Dang render cho point |
| WCS | Coverage/raster goc | GeoTIFF, DEM, raster phan tich | Khong phai layer click truc tiep | Co helper URL, chua render truc tiep |
| WMTS | Tile anh cache | Tile cache on dinh | Khong truc tiep | Co helper URL |
| TMS | Tile path cache | Tile cache/nen/lop it thay doi | Khong truc tiep | Co helper URL |
| WMS-C | WMS tile cache | Cached WMS | Qua GetFeatureInfo neu server ho tro | Co helper URL |

## 13. Huong mo rong de chon service theo layer

Hien tai MapHelper quy uoc:

```txt
POINT -> WFS
LINE/POLYGON -> WMS
```

Neu backend muon dieu khien service rieng cho tung layer, co the them field:

```js
{
  service_type: "WMS" | "WFS" | "WMTS" | "TMS" | "WMS-C" | "WCS"
}
```

Sau do MapHelper co the switch:

```js
switch (layer.service_type) {
  case "WFS":
    return addOrUpdateGeoServerPointLayer(...);
  case "WMTS":
    return addOrUpdateRasterTileLayer(buildWmtsTileUrl(layer));
  case "TMS":
    return addOrUpdateRasterTileLayer(buildTmsTileUrl(layer));
  case "WMS-C":
    return addOrUpdateRasterTileLayer(buildWmscTileUrl(layer));
  case "WMS":
  default:
    return addOrUpdateGeoServerWmsLayer(...);
}
```

WCS nen duoc coi la du lieu phan tich/tai xuong hon la layer visual truc tiep. Neu can xem coverage tren map, nen publish coverage do qua WMS/WMTS voi style phu hop.

## 14. Checklist debug khi layer khong hien thi

1. Kiem tra `.env` co `VITE_GEOSERVER_URL`.
2. Kiem tra backend layer co `geoserver_layer`, vi du `kontum:AoHo`.
3. Mo URL WMS/WFS trong trinh duyet de xem GeoServer co tra loi khong.
4. Neu WMS khong hien:
   - Kiem tra CRS `EPSG:3857`.
   - Kiem tra layer co style default.
   - Kiem tra CORS/HTTPS.
5. Neu WFS point khong hien:
   - Kiem tra `outputFormat=application/json`.
   - Kiem tra `srsName=EPSG:4326`.
   - Kiem tra GeoJSON co toa do `[lng, lat]`.
6. Neu layer sai thu tu:
   - Kiem tra `geometry_type`.
   - Kiem tra metadata priority trong Mapbox layer.
7. Neu click WMS khong ra modal:
   - Kiem tra GeoServer co bat queryable cho layer.
   - Kiem tra `GetFeatureInfo` co tra `features`.

