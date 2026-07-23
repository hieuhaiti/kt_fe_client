import { fetcher } from "@/services/apiClient/fetcher";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const SPATIAL_PATH = "/spatial";
const DEFAULT_LANG = "vi";

export function getResidentialDistance(params = {}) {
  return fetcher(
    withQuery(`${SPATIAL_PATH}/residential-distance`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
  );
}

export function useGetResidentialDistanceQuery(params = {}, options = {}) {
  return useApiQuery(
    ["spatial", "residential-distance", params],
    withQuery(`${SPATIAL_PATH}/residential-distance`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
    {
      ...options,
      enabled:
        Boolean(params.residential_code && params.forest_code) &&
        (options.enabled === undefined ? true : options.enabled),
    },
  );
}
