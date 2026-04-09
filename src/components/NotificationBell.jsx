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
import NotificationDrawer from "./NotificationDrawer";

function NotificationBell({ compact = false }) {
  const token = useAuthStore((state) => state.currentUser?.token);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
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

  const onSnooze = useCallback(async (id) => {
    updateStatusOptimistic(id, "snoozed");
    await snoozeNotification(token, id, 30);
  }, [token, updateStatusOptimistic]);

  const onEnablePermission = useCallback(async () => {
    const next = await requestNotificationPermission();
    setPermissionState(next);
  }, []);

  const buttonClass = useMemo(() => compact
    ? "relative rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm"
    : "relative flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]", [compact]);

  return (
    <div className="relative">
      <button type="button" className={buttonClass} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden>🔔</span>
        {!compact ? <span>Revision Notifications</span> : null}
        {unreadCount > 0 ? (
          <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent-danger)] px-1.5 text-[10px] font-semibold text-white">{unreadCount}</span>
        ) : null}
      </button>

      <NotificationDrawer
        open={open}
        loading={loading}
        error={error}
        permissionState={permissionState}
        notifications={notifications}
        onEnablePermission={onEnablePermission}
        onOpenItem={(item) => navigateTo(item.link)}
        onRead={onRead}
        onDone={onDone}
        onSnooze={onSnooze}
      />
    </div>
  );
}

export default NotificationBell;
