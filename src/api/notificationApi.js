import { authRequest } from "./authApi";

const toQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const fetchNotifications = (token, params) => authRequest(`/api/notifications${toQuery(params)}`, "GET", null, token);
export const fetchUnreadCount = (token) => authRequest("/api/notifications/unread-count", "GET", null, token);
export const markAllNotificationsRead = (token) => authRequest("/api/notifications/mark-all-read", "POST", {}, token);
export const markNotificationRead = (token, notificationId) => authRequest(`/api/notifications/${notificationId}/read`, "POST", {}, token);
export const markNotificationDone = (token, notificationId) => authRequest(`/api/notifications/${notificationId}/done`, "POST", {}, token);
export const dismissNotification = (token, notificationId) => authRequest(`/api/notifications/${notificationId}/dismiss`, "POST", {}, token);
export const archiveNotification = (token, notificationId) => authRequest(`/api/notifications/${notificationId}/archive`, "POST", {}, token);
export const deleteNotification = (token, notificationId) => authRequest(`/api/notifications/${notificationId}`, "DELETE", null, token);
export const clearAllNotifications = (token) => authRequest("/api/notifications", "DELETE", null, token);
export const snoozeNotification = (token, notificationId, minutes = 30) => authRequest(`/api/notifications/${notificationId}/snooze`, "POST", { minutes }, token);
export const rescheduleNotification = (token, notificationId, scheduledFor) => authRequest(`/api/notifications/${notificationId}/reschedule`, "POST", { scheduledFor }, token);
export const createAlarmNotification = (token, payload) => authRequest("/api/notifications/alarms", "POST", payload, token);
export const registerPushSubscription = (token, subscription) => authRequest("/api/notifications/push-subscriptions", "POST", subscription, token);

export const fetchNotificationPreferences = (token) => authRequest("/api/notification-preferences", "GET", null, token);
export const updateNotificationPreferences = (token, payload) => authRequest("/api/notification-preferences", "POST", payload, token);
