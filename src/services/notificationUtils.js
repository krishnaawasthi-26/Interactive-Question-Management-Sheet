export const NOTIFICATION_TYPES = ["platform", "revision", "alarm"];

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
  if (!item.scheduledFor) return item.status || "unread";
  const due = new Date(item.scheduledFor).getTime() <= Date.now();
  if (due && item.status === "unread") return "due";
  return item.status || "unread";
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
