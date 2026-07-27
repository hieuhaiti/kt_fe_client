import { fetcher } from "@/services/apiClient/fetcher";
import { useApiQuery } from "@/services/apiClient/useApi";
import { withQuery } from "@/services/apiClient/request";
import { serviceFireRiskPath } from "@/constant/serviceData";

export function useFireRiskLatest(minRiskLevel = 1, options = {}) {
  return useApiQuery(
    ["fire-risk", "latest", minRiskLevel],
    withQuery(`${serviceFireRiskPath}/latest`, { minRiskLevel }),
    { staleTime: 5 * 60 * 1000, ...options },
  );
}

export async function getFireRiskLatest(minRiskLevel = 1, options = {}) {
  return fetcher(
    withQuery(`${serviceFireRiskPath}/latest`, { minRiskLevel }),
    options,
  );
}

export async function getFireRiskMap(minRiskLevel = 4, options = {}) {
  return fetcher(
    withQuery(`${serviceFireRiskPath}/map`, { minRiskLevel }),
    options,
  );
}

export async function getFireRiskDistrictExports(snapshotId, options = {}) {
  return fetcher(
    `${serviceFireRiskPath}/snapshots/${snapshotId}/districts`,
    options,
  );
}

// Lấy list snapshot có đủ bộ raster huyện ổn định trên GeoServer. Endpoint
// public (optionalAuth) trả field an toàn cho anon, gồm mảng geoserverLayers.
//
// KHÔNG dùng `/history` — endpoint đó admin-only (requirePermission
// `fire_risk.manage`) sẽ 401 cho anon user → history rỗng trên client.
export async function getFireRiskHistory(page = 1, limit = 30, options = {}) {
  return fetcher(
    withQuery(`${serviceFireRiskPath}/published-history`, { page, limit }),
    options,
  );
}
