import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { withQuery } from "@/services/apiClient/request";
import { useApiMutation, useApiQuery } from "@/services/apiClient/useApi";

const USERS_PATH = "/admin/users";

export function getUsers(params = {}) {
  return fetcher(withQuery(USERS_PATH, { page: 1, limit: 20, lang: "vi", ...params }));
}

export function useGetUsersQuery(params = {}, options = {}) {
  const endpoint = withQuery(USERS_PATH, {
    page: 1,
    limit: 20,
    lang: "vi",
    ...params,
  });
  return useApiQuery(["users", "admin", params], endpoint, options);
}

export function createUser(payload, lang = "vi") {
  return mutater(withQuery(USERS_PATH, { lang }), "POST", payload);
}

export function getUserById(userId, lang = "vi") {
  return fetcher(withQuery(`${USERS_PATH}/${userId}`, { lang }));
}

export function updateUserRole(userId, roleCode, lang = "vi") {
  return mutater(
    withQuery(`${USERS_PATH}/${userId}/role`, { lang }),
    "PATCH",
    { roleCode },
  );
}

export function updateUserActive(userId, isActive, lang = "vi") {
  return mutater(
    withQuery(`${USERS_PATH}/${userId}/active`, { lang }),
    "PATCH",
    { isActive },
  );
}

export function resetUserPassword(userId, newPassword, lang = "vi") {
  return mutater(
    withQuery(`${USERS_PATH}/${userId}/reset-password`, { lang }),
    "POST",
    { newPassword },
  );
}

export function deleteUser(userId, lang = "vi") {
  return mutater(withQuery(`${USERS_PATH}/${userId}`, { lang }), "DELETE");
}

export function useCreateUserMutation(options = {}) {
  return useApiMutation(
    ["users", "create"],
    withQuery(USERS_PATH, { lang: "vi" }),
    "POST",
    options,
  );
}
