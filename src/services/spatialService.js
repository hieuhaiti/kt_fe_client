import { fetcher } from "@/services/apiClient/fetcher";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const SPATIAL_PATH = "/spatial";
const DEFAULT_LANG = "vi";

export function getForestChange(params = {}) {
  return fetcher(
    withQuery(`${SPATIAL_PATH}/forest-change`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
  );
}

export function useGetForestChangeQuery(params = {}, options = {}) {
  return useApiQuery(
    ["spatial", "forest-change", params],
    withQuery(`${SPATIAL_PATH}/forest-change`, {
      lang: DEFAULT_LANG,
      ...params,
    }),
    {
      ...options,
      enabled:
        Boolean(params.from_year && params.to_year) &&
        (options.enabled === undefined ? true : options.enabled),
    },
  );
}

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
