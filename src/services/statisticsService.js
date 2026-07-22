import { fetcher } from "@/services/apiClient/fetcher";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const STATS_PATH = "/stats";
const DEFAULT_LANG = "vi";

export function getAdministrativeUnits(params = {}) {
  return fetcher(
    withQuery(`${STATS_PATH}/administrative-units`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
  );
}

export function useGetAdministrativeUnitsQuery(params = {}, options = {}) {
  return useApiQuery(
    ["stats", "administrative-units", params],
    withQuery(`${STATS_PATH}/administrative-units`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
    options,
  );
}

export function getLandcoverStatistics(params = {}) {
  return fetcher(
    withQuery(`${STATS_PATH}/landcover`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
  );
}

export function useGetLandcoverStatisticsQuery(params = {}, options = {}) {
  return useApiQuery(
    ["stats", "landcover", params],
    withQuery(`${STATS_PATH}/landcover`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
    options,
  );
}

export function getStatsDashboard(params = {}) {
  return fetcher(
    withQuery(`${STATS_PATH}/dashboard`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
  );
}

export function useGetStatsDashboardQuery(params = {}, options = {}) {
  return useApiQuery(
    ["stats", "dashboard", params],
    withQuery(`${STATS_PATH}/dashboard`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
    options,
  );
}
