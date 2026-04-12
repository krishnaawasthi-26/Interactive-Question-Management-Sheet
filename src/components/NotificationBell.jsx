import { useCallback, useEffect, useMemo, useState } from "react";
import { archiveNotification, deleteNotification, dismissNotification, fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationDone, markNotificationRead, registerPushSubscription, rescheduleNotification, snoozeNotification } from "../api/notificationApi";
import { getNotificationPermissionState, requestNotificationPermission, subscribeToPushIfPossible } from "../services/notifications";
import { buildNotificationSections } from "../services/notificationUtils";
import { navigateTo, ROUTES } from "../services/routes";
import { sortNotificationsLatestFirst } from "../services/reminderNotifications";
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

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [items, countResponse] = await Promise.all([fetchNotifications(token, { size: 100 }), fetchUnreadCount(token)]);
      const next = sortNotificationsLatestFirst(Array.isArray(items) ? items : []);
      setNotifications(next);
      setUnreadCount(countResponse?.unreadCount ?? 0);
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
  const removeOptimistic = (id) => setNotifications((current) => current.filter((item) => item.id !== id));

  const onRead = async (id) => { updateStatusOptimistic(id, "read"); await markNotificationRead(token, id); loadAll(); };
  const onDone = async (id) => { updateStatusOptimistic(id, "completed"); await markNotificationDone(token, id); loadAll(); };
  const onDismiss = async (id) => { updateStatusOptimistic(id, "dismissed"); await dismissNotification(token, id); loadAll(); };
  const onArchive = async (id) => { updateStatusOptimistic(id, "archived"); await archiveNotification(token, id); loadAll(); };
  const onDelete = async (id) => { removeOptimistic(id); await deleteNotification(token, id); loadAll(); };
  const onSnooze = async (id, mins) => { await snoozeNotification(token, id, mins); loadAll(); };
  const onMarkAllRead = async () => { await markAllNotificationsRead(token); loadAll(); };

  const onReschedule = async (id) => {
    const input = window.prompt("Reschedule to (ISO date/time)", new Date(Date.now() + 3600_000).toISOString());
    if (!input) return;
    await rescheduleNotification(token, id, new Date(input).toISOString());
    loadAll();
  };

  const onEnablePermission = async () => setPermissionState(await requestNotificationPermission());

  const sections = useMemo(() => buildNotificationSections(notifications), [notifications]);

  const buttonClass = compact
    ? "btn-base btn-outline relative px-3 py-2 text-sm"
    : "btn-base btn-ghost relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm";

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
        onDelete={onDelete}
        onSnooze={onSnooze}
        onReschedule={onReschedule}
        onMarkAllRead={onMarkAllRead}
      />
      {open ? <button className="mt-2 text-xs text-[var(--accent-info)]" onClick={() => navigateTo(ROUTES.NOTIFICATIONS)}>Open all notifications →</button> : null}
    </div>
  );
}

export default NotificationBell;
