import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationDone,
  markNotificationRead,
  registerPushSubscription,
  snoozeNotification,
} from "../api/notificationApi";
import { navigateTo } from "../services/routes";
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  showDueNowBrowserNotification,
  subscribeToPushIfPossible,
} from "../services/notifications";
import { useAuthStore } from "../store/authStore";
import NotificationDrawer, { mapAlarmNotification, mapServerNotification } from "./NotificationDrawer";

const TOPIC_ALERT_STORAGE_PREFIX = "iqms-topic-alerts:";

const getLocalAlarmNotifications = () => {
  if (typeof window === "undefined") return [];

  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(TOPIC_ALERT_STORAGE_PREFIX))
    .flatMap((key) => {
      const sheetId = key.replace(TOPIC_ALERT_STORAGE_PREFIX, "") || "sheet";
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter((item) => !item.completed)
          .map((item) => ({ ...item, sheetLabel: `Sheet ${sheetId}`, link: sheetId !== "sheet-index" ? `#/app/${sheetId}` : "#/app" }));
      } catch {
        return [];
      }
    });
};

function NotificationBell({ compact = false }) {
  const token = useAuthStore((state) => state.currentUser?.token);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [alarmNotifications, setAlarmNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionState, setPermissionState] = useState(() => getNotificationPermissionState());
  const announcedDueRef = useRef(new Set());

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [items, countResponse] = await Promise.all([fetchNotifications(token), fetchUnreadCount(token)]);
      const next = Array.isArray(items) ? items : [];
      setNotifications(next);
      setAlarmNotifications(getLocalAlarmNotifications());
      setUnreadCount(countResponse?.unreadCount ?? 0);

      const dueNow = next.filter((item) => item.status === "due");
      dueNow.forEach((item) => {
        if (announcedDueRef.current.has(item.id)) return;
        announcedDueRef.current.add(item.id);
        showDueNowBrowserNotification(item);
      });
    } catch (loadErr) {
      setError(loadErr.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
    const timer = window.setInterval(loadAll, 60_000);
    return () => window.clearInterval(timer);
  }, [loadAll]);

  useEffect(() => {
    if (!open) return;
    setAlarmNotifications(getLocalAlarmNotifications());
  }, [open]);

  useEffect(() => {
    const register = async () => {
      if (!token || permissionState !== "granted") return;
      try {
        const subscription = await subscribeToPushIfPossible();
        if (subscription) {
          await registerPushSubscription(token, subscription);
        }
      } catch {
        // Best effort only.
      }
    };

    register();
  }, [permissionState, token]);

  const updateStatusOptimistic = useCallback((id, status) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);

  const onRead = useCallback(async (id) => {
    updateStatusOptimistic(id, "read");
    await markNotificationRead(token, id);
  }, [token, updateStatusOptimistic]);

  const onDone = useCallback(async (id) => {
    updateStatusOptimistic(id, "completed");
    await markNotificationDone(token, id);
  }, [token, updateStatusOptimistic]);

  const onSnooze = useCallback(async (id, group) => {
    if (group === "alarms") {
      const alarms = getLocalAlarmNotifications();
      const nextTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const updated = alarms.map((item) => (item.id === id ? { ...item, scheduledFor: nextTime } : item));
      const bySheet = updated.reduce((acc, item) => {
        const sheetId = (item.link || "#/app").replace("#/app/", "").replace("#/app", "sheet-index");
        acc[sheetId] = acc[sheetId] || [];
        acc[sheetId].push(item);
        return acc;
      }, {});
      Object.entries(bySheet).forEach(([sheetId, items]) => {
        window.localStorage.setItem(`${TOPIC_ALERT_STORAGE_PREFIX}${sheetId}`, JSON.stringify(items));
      });
      setAlarmNotifications(getLocalAlarmNotifications());
      return;
    }

    updateStatusOptimistic(id, "snoozed");
    await snoozeNotification(token, id, 30);
  }, [token, updateStatusOptimistic]);

  const onEnablePermission = useCallback(async () => {
    const next = await requestNotificationPermission();
    setPermissionState(next);
  }, []);

  const sections = useMemo(() => {
    const serverMapped = notifications.map(mapServerNotification);
    const alarmMapped = alarmNotifications.map(mapAlarmNotification);
    const promotional = serverMapped.filter((item) => item.group === "promotional");
    const alerts = serverMapped.filter((item) => item.group === "alerts");

    return {
      all: [...alerts, ...promotional, ...alarmMapped],
      promotional,
      alerts,
      alarms: alarmMapped,
    };
  }, [alarmNotifications, notifications]);

  const allCount = sections.all.length;
  const buttonClass = useMemo(() => compact
    ? "relative rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm"
    : "relative flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]", [compact]);

  return (
    <div className="relative">
      <button type="button" className={buttonClass} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden>🔔</span>
        {!compact ? <span>Notifications</span> : null}
        {allCount > 0 ? (
          <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent-danger)] px-1.5 text-[10px] font-semibold text-white">{allCount}</span>
        ) : null}
      </button>

      <NotificationDrawer
        open={open}
        loading={loading}
        error={error}
        permissionState={permissionState}
        sections={sections}
        onEnablePermission={onEnablePermission}
        onOpenItem={(item) => item.link && navigateTo(item.link)}
        onRead={onRead}
        onDone={onDone}
        onSnooze={onSnooze}
      />
    </div>
  );
}

export default NotificationBell;
