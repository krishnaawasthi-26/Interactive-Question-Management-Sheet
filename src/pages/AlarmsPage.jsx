import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { archiveNotification, createAlarmNotification, dismissNotification, fetchNotifications, markNotificationRead, snoozeNotification } from "../api/notificationApi";
import { useAuthStore } from "../store/authStore";
import { getRelativeTime } from "../services/notificationUtils";

function AlarmsPage({ theme, onThemeChange }) {
  const token = useAuthStore((s) => s.currentUser?.token);
  const userLabel = useAuthStore((s) => s.currentUser?.username || "Account");
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const load = async () => {
    const data = await fetchNotifications(token, { type: "alarm", size: 100 });
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => { if (token) load(); }, [token]);

  return <AppShell title="Alarm & Reminders" subtitle="Create and manage productivity reminders" theme={theme} onThemeChange={onThemeChange} userLabel={userLabel}>
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
      <div className="grid gap-2 md:grid-cols-4">
        <input className="field-base" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="field-base" placeholder="Note" value={message} onChange={(e) => setMessage(e.target.value)} />
        <input className="field-base" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
        <button className="btn-success" onClick={async () => {
          await createAlarmNotification(token, { title, message, scheduledFor: new Date(scheduledFor).toISOString(), sourceType: "manual" });
          setTitle(""); setMessage(""); setScheduledFor("");
          load();
        }}>Create reminder</button>
      </div>
    </div>
    <div className="mt-4 space-y-3">
      {items.map((item) => <div key={item.id} className="rounded-xl border border-[var(--border-subtle)] p-3">
        <p className="font-semibold">{item.title}</p><p className="text-sm text-[var(--text-secondary)]">{item.message}</p>
        <p className="text-xs text-[var(--text-tertiary)]">{getRelativeTime(item.scheduledFor)} • {item.status}</p>
        <div className="mt-2 flex gap-2">
          {item.status === "unread" ? <button className="btn-neutral px-2 py-1 text-xs" onClick={async () => { await markNotificationRead(token, item.id); load(); }}>Read</button> : null}
          <button className="btn-neutral px-2 py-1 text-xs" onClick={async () => { await snoozeNotification(token, item.id, 60); load(); }}>Snooze 1h</button>
          <button className="btn-neutral px-2 py-1 text-xs" onClick={async () => { await dismissNotification(token, item.id); load(); }}>Dismiss</button>
          <button className="btn-neutral px-2 py-1 text-xs" onClick={async () => { await archiveNotification(token, item.id); load(); }}>Archive</button>
        </div>
      </div>)}
    </div>
  </AppShell>;
}

export default AlarmsPage;
