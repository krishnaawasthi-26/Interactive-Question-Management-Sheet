import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { archiveNotification, dismissNotification, fetchNotifications, markAllNotificationsRead, markNotificationDone, markNotificationRead, snoozeNotification } from "../api/notificationApi";
import { useAuthStore } from "../store/authStore";
import { getRelativeTime, notificationTypeMeta } from "../services/notificationUtils";

function NotificationsPage({ theme, onThemeChange, defaultType = "all", title = "Notifications" }) {
  const token = useAuthStore((s) => s.currentUser?.token);
  const userLabel = useAuthStore((s) => s.currentUser?.username || "Account");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(defaultType);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    const data = await fetchNotifications(token, filter === "all" ? {} : { type: filter, size: 100 });
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, [token, filter]);

  const tabs = useMemo(() => ["all", "platform", "revision", "alarm"], []);

  return (
    <AppShell title={title} subtitle="Track platform updates, revision alerts, and reminders" theme={theme} onThemeChange={onThemeChange} userLabel={userLabel}>
      <div className="mb-3 flex flex-wrap gap-2">
        {tabs.map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={`btn-neutral px-3 py-1.5 text-xs ${filter === tab ? "border-[var(--accent-primary)]" : ""}`}>{tab}</button>)}
        <button className="btn-neutral px-3 py-1.5 text-xs" onClick={async () => { await markAllNotificationsRead(token); load(); }}>Mark all read</button>
      </div>
      {loading ? <p>Loading…</p> : null}
      <div className="space-y-3">
        {items.map((item) => {
          const meta = notificationTypeMeta[item.type] || notificationTypeMeta.platform;
          return <div key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
            <p className="text-xs" style={{ color: meta.tint }}>{meta.icon} {meta.label}</p>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-[var(--text-secondary)]">{item.message}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{getRelativeTime(item.scheduledFor || item.createdAt)} • {item.status}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.status === "unread" ? <button className="btn-neutral px-2 py-1 text-xs" onClick={async () => { await markNotificationRead(token, item.id); load(); }}>Read</button> : null}
              {item.type === "revision" ? <button className="btn-success px-2 py-1 text-xs" onClick={async () => { await markNotificationDone(token, item.id); load(); }}>Done</button> : null}
              {(item.type === "alarm" || item.type === "revision") ? <button className="btn-neutral px-2 py-1 text-xs" onClick={async () => { await snoozeNotification(token, item.id, 60); load(); }}>Snooze 1h</button> : null}
              <button className="btn-neutral px-2 py-1 text-xs" onClick={async () => { await dismissNotification(token, item.id); load(); }}>Dismiss</button>
              <button className="btn-neutral px-2 py-1 text-xs" onClick={async () => { await archiveNotification(token, item.id); load(); }}>Archive</button>
            </div>
          </div>;
        })}
        {!loading && items.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-8 text-center text-[var(--text-tertiary)]">No notifications found.</div> : null}
      </div>
    </AppShell>
  );
}

export default NotificationsPage;
