import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { useApiQuery } from "@/services/apiClient/useApi";
import { withQuery } from "@/services/apiClient/request";
import { serviceForestClassificationPath } from "@/constant/serviceData";

export function useForestClassificationLatest(options = {}) {
  return useApiQuery(
    ["forest-classification", "latest"],
    `${serviceForestClassificationPath}/latest`,
    { staleTime: 10 * 60 * 1000, ...options },
  );
}

export function useForestClassificationSnapshot(id, options = {}) {
  return useApiQuery(
    ["forest-classification", "snapshot", id],
    `${serviceForestClassificationPath}/snapshot/${id}`,
    { enabled: !!id, staleTime: 0, ...options },
  );
}

export async function getForestClassificationLatest() {
  return fetcher(`${serviceForestClassificationPath}/latest`);
}

export async function queryForestClassification(year, month) {
  return mutater(`${serviceForestClassificationPath}/query`, "POST", {
    year,
    month,
  });
}

export async function getForestClassificationSnapshot(id) {
  return fetcher(`${serviceForestClassificationPath}/snapshot/${id}`);
}

export async function getForestClassificationPublishedHistory(page = 1, limit = 24) {
  return fetcher(
    withQuery(`${serviceForestClassificationPath}/published-history`, {
      page,
      limit,
    }),
  );
}
