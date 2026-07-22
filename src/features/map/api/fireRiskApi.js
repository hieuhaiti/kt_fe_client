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

export async function getFireRiskLatest(minRiskLevel = 1) {
  return fetcher(
    withQuery(`${serviceFireRiskPath}/latest`, { minRiskLevel }),
  );
}

export async function getFireRiskMap(minRiskLevel = 4) {
  return fetcher(
    withQuery(`${serviceFireRiskPath}/map`, { minRiskLevel }),
  );
}

// Lấy list snapshot đã publish GeoServer — client dùng để browse các bản
// phân tích tháng trước và add lại layer WMS làm overlay so sánh. Endpoint
// public (optionalAuth) `/published-history` — force filter geoserver_layer,
// trả subset field an toàn cho anon.
//
// KHÔNG dùng `/history` — endpoint đó admin-only (requirePermission
// `fire_risk.manage`) sẽ 401 cho anon user → history rỗng trên client.
export async function getFireRiskHistory(page = 1, limit = 30) {
  return fetcher(
    withQuery(`${serviceFireRiskPath}/published-history`, { page, limit }),
  );
}
