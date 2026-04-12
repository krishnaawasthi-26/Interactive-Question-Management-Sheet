const DUE_STATUSES = new Set(["unread", "overdue"]);
const SUPPORTED_TYPES = new Set(["revision", "alarm"]);
const NOTIFIED_STORAGE_KEY = "iqms-notified-reminders";

const isBrowser = typeof window !== "undefined";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const toNotificationEventKey = (notification) => {
  const id = notification?.id || "unknown";
  const scheduledFor = notification?.scheduledFor || "unscheduled";
  return `${id}:${scheduledFor}`;
};

export const isDueReminderNotification = (notification, now = Date.now()) => {
  if (!notification || !SUPPORTED_TYPES.has(notification.type)) return false;
  if (!DUE_STATUSES.has(notification.status)) return false;
  if (!notification.scheduledFor) return false;
  const scheduledTime = new Date(notification.scheduledFor).getTime();
  return Number.isFinite(scheduledTime) && scheduledTime <= now;
};

const byLatestFirst = (left, right) => {
  const leftTime = new Date(left?.scheduledFor || left?.createdAt || 0).getTime();
  const rightTime = new Date(right?.scheduledFor || right?.createdAt || 0).getTime();
  return rightTime - leftTime;
};

export const sortNotificationsLatestFirst = (items = []) => [...items].sort(byLatestFirst);

export const getDueRemindersLatestFirst = (items = [], now = Date.now()) => sortNotificationsLatestFirst(items.filter((item) => isDueReminderNotification(item, now)));

export const readPersistedNotifiedKeys = () => {
  if (!isBrowser) return new Set();
  const stored = safeParse(window.localStorage.getItem(NOTIFIED_STORAGE_KEY), []);
  if (!Array.isArray(stored)) return new Set();
  return new Set(stored.filter((entry) => typeof entry === "string"));
};

export const persistNotifiedKeys = (keys) => {
  if (!isBrowser) return;
  const values = Array.from(keys);
  const latest = values.slice(Math.max(0, values.length - 400));
  window.localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(latest));
};
