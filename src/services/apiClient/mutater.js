import { apiRequest } from "@/services/apiClient/request";

export function mutater(endpoint, method = "POST", body, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method,
    body,
  });
}
