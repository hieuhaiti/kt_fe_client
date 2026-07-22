import { apiRequest } from "@/services/apiClient/request";

export function fetcher(endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: options.method || "GET",
  });
}
