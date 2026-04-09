import { authRequest } from "./authApi";

export const fetchNotifications = (token) => authRequest("/api/notifications", "GET", null, token);
export const fetchUnreadCount = (token) => authRequest("/api/notifications/unread-count", "GET", null, token);
export const markNotificationRead = (token, notificationId) =>
  authRequest(`/api/notifications/${notificationId}/read`, "POST", {}, token);
export const markNotificationDone = (token, notificationId) =>
  authRequest(`/api/notifications/${notificationId}/done`, "POST", {}, token);
export const snoozeNotification = (token, notificationId, minutes = 30) =>
  authRequest(`/api/notifications/${notificationId}/snooze`, "POST", { minutes }, token);
export const registerPushSubscription = (token, subscription) =>
  authRequest("/api/notifications/push-subscriptions", "POST", subscription, token);
