import { fetcher } from "@/services/apiClient/fetcher";
import { mutater } from "@/services/apiClient/mutater";
import { withQuery } from "@/services/apiClient/request";
import { useApiQuery } from "@/services/apiClient/useApi";

const NOTIFICATIONS_PATH = "/notifications";

export function useGetNotificationsQuery(params = {}, options = {}) {
  return useApiQuery(
    ["notifications", params],
    withQuery(NOTIFICATIONS_PATH, {
      page: 1,
      limit: 20,
      onlyUnread: false,
      lang: "vi",
      ...params,
    }),
    options,
  );
}

export const useGetMyNotificationsQuery = useGetNotificationsQuery;

export function getNotifications(params = {}) {
  return fetcher(
    withQuery(NOTIFICATIONS_PATH, {
      page: 1,
      limit: 20,
      onlyUnread: false,
      lang: "vi",
      ...params,
    }),
  );
}

export const getMyNotifications = getNotifications;

export function getUnreadCount(lang = "vi") {
  return fetcher(withQuery(`${NOTIFICATIONS_PATH}/unread-count`, { lang }));
}

export function useGetUnreadCountQuery(options = {}) {
  return useApiQuery(
    ["notifications", "unread-count"],
    withQuery(`${NOTIFICATIONS_PATH}/unread-count`, { lang: "vi" }),
    options,
  );
}

export function markAllNotificationsAsRead(lang = "vi") {
  return mutater(
    withQuery(`${NOTIFICATIONS_PATH}/read-all`, { lang }),
    "PATCH",
  );
}

export function markNotificationAsRead(notificationId, lang = "vi") {
  return mutater(
    withQuery(`${NOTIFICATIONS_PATH}/${notificationId}/read`, { lang }),
    "PATCH",
  );
}

export function deleteNotification(notificationId, lang = "vi") {
  return mutater(
    withQuery(`${NOTIFICATIONS_PATH}/${notificationId}`, { lang }),
    "DELETE",
  );
}

export function registerNotificationDevice(payload, lang = "vi") {
  return mutater(
    withQuery(`${NOTIFICATIONS_PATH}/devices`, { lang }),
    "POST",
    payload,
  );
}

export function unregisterNotificationDevice(token, lang = "vi") {
  return mutater(
    withQuery(`${NOTIFICATIONS_PATH}/devices`, { lang }),
    "DELETE",
    { token },
  );
}

export function sendNotification(payload, lang = "vi") {
  return mutater(
    withQuery(`${NOTIFICATIONS_PATH}/send`, { lang }),
    "POST",
    payload,
  );
}
