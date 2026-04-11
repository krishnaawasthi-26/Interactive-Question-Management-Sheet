import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { archiveNotification, dismissNotification, fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationDone, markNotificationRead, registerPushSubscription, snoozeNotification } from "../api/notificationApi";
import { navigateTo, ROUTES } from "../services/routes";
import { getNotificationPermissionState, requestNotificationPermission, showDueNowBrowserNotification, subscribeToPushIfPossible } from "../services/notifications";
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
    try {
      const [items, countResponse] = await Promise.all([fetchNotifications(token, { size: 60 }), fetchUnreadCount(token)]);
      const next = Array.isArray(items) ? items : [];
      setNotifications(next);
      setUnreadCount(countResponse?.unreadCount ?? 0);
      next.filter((item) => item.type === "revision" && item.status === "unread" && new Date(item.scheduledFor).getTime() <= Date.now()).forEach((item) => {
        if (announcedDueRef.current.has(item.id)) return;
        announcedDueRef.current.add(item.id);
        showDueNowBrowserNotification({ ...item, link: item.actionUrl, revisionNumber: item.metadata?.revisionNumber, sheetTitle: item.metadata?.sheetTitle });
      });
      setError("");
    } catch (loadErr) {
      setError(loadErr.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
    const timer = window.setInterval(loadAll, 45_000);
    return () => window.clearInterval(timer);
  }, [loadAll]);

  useEffect(() => {
    const register = async () => {
      if (!token || permissionState !== "granted") return;
      const subscription = await subscribeToPushIfPossible();
      if (subscription) await registerPushSubscription(token, subscription);
    };
    register().catch(() => undefined);
  }, [permissionState, token]);

  const updateStatusOptimistic = (id, status) => setNotifications((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  const onRead = async (id) => { updateStatusOptimistic(id, "read"); await markNotificationRead(token, id); loadAll(); };
  const onDone = async (id) => { updateStatusOptimistic(id, "completed"); await markNotificationDone(token, id); loadAll(); };
  const onDismiss = async (id) => { updateStatusOptimistic(id, "dismissed"); await dismissNotification(token, id); loadAll(); };
  const onArchive = async (id) => { updateStatusOptimistic(id, "archived"); await archiveNotification(token, id); loadAll(); };
  const onSnooze = async (id, mins) => { await snoozeNotification(token, id, mins); loadAll(); };
  const onMarkAllRead = async () => { await markAllNotificationsRead(token); loadAll(); };
  const onEnablePermission = async () => setPermissionState(await requestNotificationPermission());

  const sections = useMemo(() => ({
    all: notifications,
    platform: notifications.filter((n) => n.type === "platform"),
    revision: notifications.filter((n) => n.type === "revision"),
    alarm: notifications.filter((n) => n.type === "alarm"),
  }), [notifications]);

  const buttonClass = compact
    ? "relative rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm"
    : "relative flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]";

  return (
    <div className="relative">
      <button type="button" className={buttonClass} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden>🔔</span>
        {!compact ? <span>Notifications</span> : null}
        {unreadCount > 0 ? <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent-danger)] px-1.5 text-[10px] font-semibold text-white">{unreadCount}</span> : null}
      </button>
      <NotificationDrawer
        open={open}
        loading={loading}
        error={error}
        permissionState={permissionState}
        sections={sections}
        onEnablePermission={onEnablePermission}
        onOpenItem={(item) => item.actionUrl && navigateTo(item.actionUrl)}
        onRead={onRead}
        onDone={onDone}
        onDismiss={onDismiss}
        onArchive={onArchive}
        onSnooze={onSnooze}
        onMarkAllRead={onMarkAllRead}
      />
      {open ? <button className="mt-2 text-xs text-[var(--accent-info)]" onClick={() => navigateTo(ROUTES.NOTIFICATIONS)}>Open all notifications →</button> : null}
    </div>
  );
}

export default NotificationBell;
