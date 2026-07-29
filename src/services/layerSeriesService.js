import { fetcher } from "@/services/apiClient/fetcher";
import { useApiQuery } from "@/services/apiClient/useApi";
import { withQuery } from "@/services/apiClient/request";

const LAYER_GROUPS_PATH = "/map/layer-groups";

export function getLayerGroups(params = {}) {
  return fetcher(withQuery(LAYER_GROUPS_PATH, { lang: "vi", ...params }));
}

export function useGetLayerGroupsQuery(params = {}, options = {}) {
  const queryParams = { lang: "vi", ...params };

  return useApiQuery(
    ["map", "layer-groups", queryParams],
    withQuery(LAYER_GROUPS_PATH, queryParams),
    options,
  );
}

export function getLayerGroupTimeline(groupCode, params = {}) {
  return fetcher(
    withQuery(
      `${LAYER_GROUPS_PATH}/${encodeURIComponent(groupCode)}/timeline`,
      { lang: "vi", ...params },
    ),
  );
}

export function useGetLayerGroupTimelineQuery(
  groupCode,
  params = {},
  options = {},
) {
  const queryParams = { lang: "vi", ...params };

  return useApiQuery(
    ["map", "layer-groups", groupCode, "timeline", queryParams],
    withQuery(
      `${LAYER_GROUPS_PATH}/${encodeURIComponent(groupCode)}/timeline`,
      queryParams,
    ),
    { enabled: Boolean(groupCode), ...options },
  );
}
