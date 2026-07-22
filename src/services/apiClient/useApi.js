import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";

export function useApiQuery(
  queryKey,
  endpoint,
  options = {},
) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: () => fetcher(endpoint),
    retry: false,
    ...options,
  });
}

export function useApiMutation(
  queryKey,
  endpoint,
  method = "POST",
  options = {},
) {
  return useMutation({
    mutationKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    mutationFn: (body) => mutater(endpoint, method, body),
    ...options,
  });
}

export function useQueryCache() {
  const queryClient = useQueryClient();

  return {
    getCachedData: (key) =>
      queryClient.getQueryData(Array.isArray(key) ? key : [key]),
    setCachedData: (key, data) =>
      queryClient.setQueryData(Array.isArray(key) ? key : [key], data),
    removeQuery: (key) =>
      queryClient.removeQueries({
        queryKey: Array.isArray(key) ? key : [key],
      }),
  };
}
