import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import SurfaceCard from "../components/ui/SurfaceCard";
import { archiveNotification, createAlarmNotification, dismissNotification, fetchNotifications, markNotificationDone, markNotificationRead, rescheduleNotification, snoozeNotification } from "../api/notificationApi";
import { useAuthStore } from "../store/authStore";
import { getRelativeTime } from "../services/notificationUtils";
import { navigateTo, ROUTES } from "../services/routes";

const quickPresets = [
  { label: "in 1 hour", getDate: () => new Date(Date.now() + 60 * 60 * 1000) },
  { label: "in 2 hours", getDate: () => new Date(Date.now() + 2 * 60 * 60 * 1000) },
  { label: "in 4 hours", getDate: () => new Date(Date.now() + 4 * 60 * 60 * 1000) },
  { label: "tomorrow morning", getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
  { label: "tomorrow evening", getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(19, 0, 0, 0); return d; } },
];

function AlarmsPage({ theme, onThemeChange }) {
  const token = useAuthStore((s) => s.currentUser?.token);
  const userLabel = useAuthStore((s) => s.currentUser?.username || "Account");
  const logout = useAuthStore((s) => s.logout);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("none");
  const [recurrenceEvery, setRecurrenceEvery] = useState(1);
  const [formMessage, setFormMessage] = useState("");

  const load = async () => {
    if (!token) return;

    try {
      const data = await fetchNotifications(token, { type: "alarm", size: 100 });
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error?.status === 401 || /unauthorized/i.test(error?.message || "")) {
        logout();
        navigateTo(ROUTES.LOGIN);
        return;
      }
      setFormMessage(error?.message || "Could not load reminders right now.");
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const groups = useMemo(() => {
    const now = Date.now();
    return {
      overdue: items.filter((i) => i.status === "overdue" || new Date(i.scheduledFor).getTime() < now && i.status === "unread"),
      upcoming: items.filter((i) => new Date(i.scheduledFor).getTime() >= now && ["unread", "read"].includes(i.status)),
      completed: items.filter((i) => i.status === "completed"),
    };
  }, [items]);

  const createReminder = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormMessage("Please enter a title before creating a reminder.");
      return;
    }
    if (!scheduledFor) {
      setFormMessage("Please choose a date and time.");
      return;
    }

    const scheduledInstant = new Date(scheduledFor);
    if (Number.isNaN(scheduledInstant.getTime()) || scheduledInstant.getTime() <= Date.now()) {
      setFormMessage("Pick a valid future date and time.");
      return;
    }

    if (!token) {
      setFormMessage("Your session has expired. Please sign in again and retry.");
      navigateTo(ROUTES.LOGIN);
      return;
    }

    try {
      const payload = {
        title: trimmedTitle,
        message: message.trim() || `Reminder for: ${trimmedTitle}`,
        scheduledFor: scheduledInstant.toISOString(),
        sourceType: "manual",
      };
      if (recurrenceType !== "none") {
        payload.recurrence = { type: recurrenceType, every: Number(recurrenceEvery) || 1 };
      }
      await createAlarmNotification(token, payload);
      setTitle("");
      setMessage("");
      setScheduledFor("");
      setRecurrenceType("none");
      setRecurrenceEvery(1);
      setFormMessage("Reminder created successfully.");
      load();
    } catch (error) {
      if (error?.status === 401 || /unauthorized/i.test(error?.message || "")) {
        logout();
        setFormMessage("Your session has expired. Please sign in again and retry.");
        navigateTo(ROUTES.LOGIN);
        return;
      }
      setFormMessage(error?.message || "Could not create reminder. Please try again.");
    }
  };

  const ReminderRow = ({ item }) => <div className="rounded-xl border border-[var(--border-subtle)] p-3">
    <p className="font-semibold">{item.title}</p><p className="text-sm text-[var(--text-secondary)]">{item.message}</p>
    <p className="text-xs text-[var(--text-tertiary)]">{getRelativeTime(item.scheduledFor)} • {item.status}</p>
    <div className="mt-2 flex flex-wrap gap-2">
      {item.status === "unread" || item.status === "overdue" ? <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={async () => { await markNotificationRead(token, item.id); load(); }}>Read</button> : null}
      <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={async () => { await snoozeNotification(token, item.id, 60); load(); }}>Snooze 1h</button>
      <button className="btn-base btn-success px-2 py-1 text-xs" onClick={async () => { await markNotificationDone(token, item.id); load(); }}>Done</button>
      <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={async () => {
        const input = window.prompt("Reschedule to (ISO date/time)", new Date(Date.now() + 3600_000).toISOString());
        if (!input) return;
        await rescheduleNotification(token, item.id, new Date(input).toISOString());
        load();
      }}>Reschedule</button>
      <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={async () => { await dismissNotification(token, item.id); load(); }}>Dismiss</button>
      <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={async () => { await archiveNotification(token, item.id); load(); }}>Archive</button>
    </div>
  </div>;

  return <AppShell title="Alarm & Reminders" subtitle="Create and manage productivity reminders" theme={theme} onThemeChange={onThemeChange} userLabel={userLabel}>
    <div className="space-y-4">
      <SurfaceCard title="Create reminder" description="Use quick presets or custom date-time with optional recurrence.">
        <div className="mb-2 flex flex-wrap gap-2">
          {quickPresets.map((preset) => <button key={preset.label} className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => setScheduledFor(preset.getDate().toISOString().slice(0, 16))}>{preset.label}</button>)}
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          <input className="field-base" placeholder="Title" value={title} onChange={(e) => { setTitle(e.target.value); setFormMessage(""); }} />
          <input className="field-base" placeholder="Note (optional)" value={message} onChange={(e) => { setMessage(e.target.value); setFormMessage(""); }} />
          <input className="field-base" type="datetime-local" value={scheduledFor} onChange={(e) => { setScheduledFor(e.target.value); setFormMessage(""); }} />
          <select className="field-base" value={recurrenceType} onChange={(e) => { setRecurrenceType(e.target.value); setFormMessage(""); }}>
            <option value="none">No repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
          </select>
          <button className="btn-base btn-success" onClick={createReminder}>Create reminder</button>
        </div>
        {recurrenceType !== "none" ? <input className="field-base mt-2 w-40" type="number" min="1" value={recurrenceEvery} onChange={(e) => setRecurrenceEvery(e.target.value)} /> : null}
        {formMessage ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{formMessage}</p> : null}
      </SurfaceCard>

      <SurfaceCard title="Overdue" description="Recover missed reminders quickly.">{groups.overdue.length ? <div className="space-y-3">{groups.overdue.map((item) => <ReminderRow key={item.id} item={item} />)}</div> : <p className="meta-text">No overdue reminders.</p>}</SurfaceCard>
      <SurfaceCard title="Upcoming" description="Scheduled reminders and alarms.">{groups.upcoming.length ? <div className="space-y-3">{groups.upcoming.map((item) => <ReminderRow key={item.id} item={item} />)}</div> : <p className="meta-text">No upcoming reminders.</p>}</SurfaceCard>
      <SurfaceCard title="Completed" description="Completed reminders history.">{groups.completed.length ? <div className="space-y-3">{groups.completed.map((item) => <ReminderRow key={item.id} item={item} />)}</div> : <p className="meta-text">No completed reminders.</p>}</SurfaceCard>
    </div>
  </AppShell>;
}

export default AlarmsPage;
