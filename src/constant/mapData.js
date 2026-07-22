// Trung tâm vùng nghiên cứu Kon Tum theo bbox trong tài liệu nghiệp vụ:
// [107.25, 13.85, 108.75, 15.45].
// The max bounds must contain a desktop viewport at `defaultZoom`.
// A ±1° extent forces Mapbox to raise zoom to roughly 9 to satisfy maxBounds.
export const mapDelta = 2.25;

export const defaultLatLong = { lat: 14.65, lng: 108 };
export const defaultZoom = 8;
export const defaultStyle = import.meta.env.VITE_MAPBOX_STYLE_Outdoor;

export const stateBuildingRender = false;
export const stateTerrainRender = false;
