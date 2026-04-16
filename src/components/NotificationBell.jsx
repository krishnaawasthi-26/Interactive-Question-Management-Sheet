import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { archiveNotification, clearAllNotifications, deleteNotification, dismissNotification, fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationDone, markNotificationRead, registerPushSubscription, rescheduleNotification, snoozeNotification } from "../api/notificationApi";
import { getNotificationPermissionState, requestNotificationPermission, subscribeToPushIfPossible } from "../services/notifications";
import { emitNotificationChanged, subscribeNotificationChanged } from "../services/notificationEvents";
import { buildNotificationSections } from "../services/notificationUtils";
import { navigateTo, ROUTES } from "../services/routes";
import { sortNotificationsLatestFirst } from "../services/reminderNotifications";
import { useAuthStore } from "../store/authStore";
import NotificationDrawer from "./NotificationDrawer";

function NotificationBell({ compact = false }) {
  const token = useAuthStore((state) => state.currentUser?.token);
  const containerRef = useRef(null);
  const bellButtonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionState, setPermissionState] = useState(() => getNotificationPermissionState());
  const [drawerPosition, setDrawerPosition] = useState({ top: 56, right: 12, width: 460 });

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

  useEffect(() => subscribeNotificationChanged(() => loadAll()), [loadAll]);

  const onRead = async (id) => { updateStatusOptimistic(id, "read"); await markNotificationRead(token, id); emitNotificationChanged({ type: "read", id }); loadAll(); };
  const onDone = async (id) => { updateStatusOptimistic(id, "completed"); await markNotificationDone(token, id); emitNotificationChanged({ type: "done", id }); loadAll(); };
  const onDismiss = async (id) => { updateStatusOptimistic(id, "dismissed"); await dismissNotification(token, id); emitNotificationChanged({ type: "dismiss", id }); loadAll(); };
  const onArchive = async (id) => { updateStatusOptimistic(id, "archived"); await archiveNotification(token, id); emitNotificationChanged({ type: "archive", id }); loadAll(); };
  const onDelete = async (id) => {
    const previous = notifications;
    removeOptimistic(id);
    try {
      await deleteNotification(token, id);
      emitNotificationChanged({ type: "delete", id });
      await loadAll();
      setError("");
    } catch (deleteErr) {
      setNotifications(previous);
      setError(deleteErr?.message || "Failed to delete notification.");
    }
  };
  const onSnooze = async (id, mins) => { await snoozeNotification(token, id, mins); emitNotificationChanged({ type: "snooze", id }); loadAll(); };
  const onMarkAllRead = async () => { await markAllNotificationsRead(token); emitNotificationChanged({ type: "mark-all-read" }); loadAll(); };
  const onClearAll = async () => {
    const previous = notifications;
    setNotifications([]);
    setUnreadCount(0);
    try {
      await clearAllNotifications(token);
      emitNotificationChanged({ type: "clear-all" });
      await loadAll();
      setError("");
    } catch (clearErr) {
      setNotifications(previous);
      setError(clearErr?.message || "Failed to clear notifications.");
      await loadAll();
    }
  };

  const onReschedule = async (id) => {
    const input = window.prompt("Reschedule to (ISO date/time)", new Date(Date.now() + 3600_000).toISOString());
    if (!input) return;
    await rescheduleNotification(token, id, new Date(input).toISOString());
    emitNotificationChanged({ type: "reschedule", id });
    loadAll();
  };

  const onEnablePermission = async () => setPermissionState(await requestNotificationPermission());

  const sections = useMemo(() => buildNotificationSections(notifications), [notifications]);


  useEffect(() => {
    if (!open) return undefined;

    const updateDrawerPosition = () => {
      const bellNode = bellButtonRef.current;
      if (!bellNode) return;
      const rect = bellNode.getBoundingClientRect();
      const viewportPadding = 12;
      const maxDrawerWidth = 460;
      const desiredWidth = Math.min(maxDrawerWidth, window.innerWidth - viewportPadding * 2);
      const right = Math.max(viewportPadding, window.innerWidth - rect.right);
      setDrawerPosition({
        top: Math.round(rect.bottom + 8),
        right: Math.round(right),
        width: Math.round(desiredWidth),
      });
    };

    updateDrawerPosition();

    const handlePointerDown = (event) => {
      const target = event.target;
      const containerNode = containerRef.current;
      const bellNode = bellButtonRef.current;
      if (containerNode?.contains(target) || bellNode?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("resize", updateDrawerPosition);
    window.addEventListener("scroll", updateDrawerPosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updateDrawerPosition);
      window.removeEventListener("scroll", updateDrawerPosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const buttonClass = compact
    ? "btn-base btn-outline relative px-3 py-2 text-sm"
    : "btn-base btn-ghost relative flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm";

  return (
    <div ref={containerRef} className="relative">
      <button ref={bellButtonRef} type="button" className={buttonClass} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden>🔔</span>
        {!compact ? <span>Notifications</span> : null}
        {unreadCount > 0 ? <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent-danger)] px-1.5 text-[10px] font-semibold text-[var(--text-on-danger)]">{unreadCount}</span> : null}
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
        onClearAll={onClearAll}
        position={drawerPosition}
        onOpenAll={() => {
          setOpen(false);
          navigateTo(ROUTES.NOTIFICATIONS);
        }}
      />
    </div>
  );
}

export default NotificationBell;
