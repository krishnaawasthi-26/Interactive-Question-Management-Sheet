export const NOTIFICATION_TYPES = ["platform", "revision", "alarm"];

export const ACTIVE_NOTIFICATION_STATES = new Set(["unread", "read", "overdue"]);

export const getRelativeTime = (value) => {
  if (!value) return "now";
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return "now";
  const diff = ts - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return diff < 0 ? `${mins}m ago` : `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return diff < 0 ? `${hrs}h ago` : `in ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return diff < 0 ? `${days}d ago` : `in ${days}d`;
};

export const getNotificationState = (item) => {
  if (item.status === "completed") return "completed";
  if (item.status === "overdue") return "overdue";
  if (!item.scheduledFor) return item.status || "unread";
  const due = new Date(item.scheduledFor).getTime() <= Date.now();
  if (due && item.status === "unread") return "due";
  return item.status || "unread";
};

export const isArchivedNotification = (item) => item?.status === "archived";

export const isActiveNotification = (item) => ACTIVE_NOTIFICATION_STATES.has(item?.status || "unread");

export const buildNotificationSections = (notifications = []) => {
  const active = notifications.filter(isActiveNotification);
  const archived = notifications.filter(isArchivedNotification);

  return {
    all: notifications,
    active,
    archived,
    platform: notifications.filter((n) => n.type === "platform"),
    revision: notifications.filter((n) => n.type === "revision"),
    alarm: notifications.filter((n) => n.type === "alarm"),
    overdue: notifications.filter((n) => n.status === "overdue"),
  };
};

export const notificationTypeMeta = {
  platform: { label: "Platform", icon: "📣", tint: "var(--accent-info)" },
  revision: { label: "Revision", icon: "📚", tint: "var(--accent-warning)" },
  alarm: { label: "Alarm", icon: "⏰", tint: "var(--accent-success)" },
};

export const priorityClass = {
  low: "text-[var(--text-tertiary)]",
  medium: "text-[var(--accent-info)]",
  high: "text-[var(--accent-danger)]",
};
