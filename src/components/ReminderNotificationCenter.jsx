import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications } from "../api/notificationApi";
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  showDueNowBrowserNotification,
} from "../services/notifications";
import {
  getDueRemindersLatestFirst,
  persistNotifiedKeys,
  readPersistedNotifiedKeys,
  toNotificationEventKey,
} from "../services/reminderNotifications";
import { useAuthStore } from "../store/authStore";

const POLL_INTERVAL_MS = 10_000;
const MAX_VISIBLE_TOASTS = 4;

const formatDueLabel = (scheduledFor) => {
  if (!scheduledFor) return "Due now";
  const scheduledTime = new Date(scheduledFor).getTime();
  if (!Number.isFinite(scheduledTime)) return "Due now";
  const delta = Date.now() - scheduledTime;
  if (delta < 60_000) return "Due now";
  return `Due ${new Date(scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

function ReminderNotificationCenter() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.currentUser?.token);
  const [toasts, setToasts] = useState([]);
  const [permissionState, setPermissionState] = useState(() => getNotificationPermissionState());
  const [pollError, setPollError] = useState("");
  const announcedRef = useRef(readPersistedNotifiedKeys());

  const dismissToast = useCallback((eventKey) => {
    setToasts((current) => current.filter((toast) => toast.eventKey !== eventKey));
  }, []);

  const openNotification = useCallback((notification) => {
    const route = notification?.actionUrl || "/notifications";
    navigate(route);
  }, [navigate]);

  const announceDueNotifications = useCallback(async (notifications) => {
    if (!notifications.length) return;

    const unseen = notifications.filter((item) => !announcedRef.current.has(toNotificationEventKey(item)));
    if (!unseen.length) return;

    unseen.forEach((item) => announcedRef.current.add(toNotificationEventKey(item)));
    persistNotifiedKeys(announcedRef.current);

    setToasts((current) => {
      const combined = [
        ...unseen.map((item) => ({ eventKey: toNotificationEventKey(item), notification: item })),
        ...current,
      ];
      combined.sort((left, right) => new Date(right.notification?.scheduledFor || 0).getTime() - new Date(left.notification?.scheduledFor || 0).getTime());
      return combined.slice(0, MAX_VISIBLE_TOASTS);
    });

    for (const item of unseen) {
      if (permissionState !== "granted") continue;
      await showDueNowBrowserNotification({
        ...item,
        link: item.actionUrl,
        revisionNumber: item.metadata?.revisionNumber,
        sheetTitle: item.metadata?.sheetTitle,
      });
    }
  }, [permissionState]);

  const pollDueNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const items = await fetchNotifications(token, { size: 80, status: "due" });
      const dueReminders = getDueRemindersLatestFirst(Array.isArray(items) ? items : []);
      await announceDueNotifications(dueReminders);
      setPollError("");
    } catch (error) {
      if (error?.status === 401) {
        return;
      }
      setPollError(error?.message || "Could not check due reminders.");
    }
  }, [announceDueNotifications, token]);

  useEffect(() => {
    if (!token) {
      setToasts([]);
      setPollError("");
      return;
    }
    pollDueNotifications();
    const timer = window.setInterval(pollDueNotifications, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [pollDueNotifications, token]);

  useEffect(() => {
    if (!token) return undefined;

    const triggerRefresh = () => {
      if (document.visibilityState === "hidden") return;
      pollDueNotifications();
    };

    window.addEventListener("focus", triggerRefresh);
    document.addEventListener("visibilitychange", triggerRefresh);

    return () => {
      window.removeEventListener("focus", triggerRefresh);
      document.removeEventListener("visibilitychange", triggerRefresh);
    };
  }, [pollDueNotifications, token]);

  const canRequestPermission = permissionState === "default";
  if (!token || (!toasts.length && !pollError && !canRequestPermission)) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[2147483597] w-[min(92vw,420px)] space-y-3">
      {canRequestPermission ? (
        <div className="pointer-events-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-xl">
          <p className="text-sm font-medium text-[var(--text-primary)]">Enable browser reminders</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Get notifications when reminders are due while this tab is in the background.</p>
          <button
            type="button"
            className="btn-base btn-neutral mt-2 px-3 py-1.5 text-xs"
            onClick={async () => setPermissionState(await requestNotificationPermission())}
          >
            Enable browser notifications
          </button>
        </div>
      ) : null}

      {pollError ? (
        <div className="pointer-events-auto rounded-xl border border-[color-mix(in_srgb,var(--accent-danger)_50%,transparent)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--accent-danger)] shadow-xl">
          {pollError}
        </div>
      ) : null}

      {toasts.map(({ eventKey, notification }) => (
        <article key={eventKey} className="pointer-events-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{notification.title || "Reminder"}</p>
              {notification.message ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{notification.message}</p> : null}
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">{formatDueLabel(notification.scheduledFor)}</p>
            </div>
            <button type="button" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" onClick={() => dismissToast(eventKey)}>✕</button>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn-base btn-neutral px-3 py-1.5 text-xs" onClick={() => openNotification(notification)}>View</button>
            <button type="button" className="btn-base btn-neutral px-3 py-1.5 text-xs" onClick={() => dismissToast(eventKey)}>Dismiss</button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default ReminderNotificationCenter;
