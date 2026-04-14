import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import NotificationItemCard from "../components/ui/NotificationItemCard";
import SurfaceCard from "../components/ui/SurfaceCard";
import { archiveNotification, clearAllNotifications, deleteNotification, dismissNotification, fetchNotificationPreferences, fetchNotifications, markAllNotificationsRead, markNotificationDone, markNotificationRead, rescheduleNotification, snoozeNotification, updateNotificationPreferences } from "../api/notificationApi";
import { emitNotificationChanged, subscribeNotificationChanged } from "../services/notificationEvents";
import { navigateTo } from "../services/routes";
import { sortNotificationsLatestFirst } from "../services/reminderNotifications";
import { useAuthStore } from "../store/authStore";

function NotificationsPage({ theme, onThemeChange, defaultType = "all", title = "Notifications" }) {
  const token = useAuthStore((s) => s.currentUser?.token);
  const userLabel = useAuthStore((s) => s.currentUser?.username || "Account");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState(defaultType);
  const [statusFilter, setStatusFilter] = useState("all");
  const [preferences, setPreferences] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = { size: 100 };
    if (typeFilter !== "all") params.type = typeFilter;
    if (statusFilter !== "all") params.status = statusFilter;
    const [data, prefs] = await Promise.all([fetchNotifications(token, params), fetchNotificationPreferences(token)]);
    setItems(sortNotificationsLatestFirst(Array.isArray(data) ? data : []));
    setPreferences(prefs || null);
    setError("");
    setLoading(false);
  }, [statusFilter, token, typeFilter]);

  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);
  useEffect(() => subscribeNotificationChanged(() => load()), [load]);

  const typeTabs = useMemo(() => ["all", "platform", "revision", "alarm"], []);
  const statusTabs = useMemo(() => ["all", "unread", "due", "upcoming", "overdue", "completed", "archived"], []);

  const savePreference = async (patch) => {
    if (!token) return;
    const next = await updateNotificationPreferences(token, patch);
    setPreferences(next);
  };

  return (
    <AppShell title={title} subtitle="Track platform updates, revision alerts, and reminders" theme={theme} onThemeChange={onThemeChange} userLabel={userLabel}>
      <div className="space-y-4">
        <SurfaceCard title="Filters" description="Slice notifications by category and timeline state.">
          <div className="mb-3 flex flex-wrap gap-2">
            {typeTabs.map((tab) => <button key={tab} onClick={() => setTypeFilter(tab)} className={`btn-base btn-neutral px-3 py-1.5 text-xs ${typeFilter === tab ? "border-[var(--accent-primary)]" : ""}`}>{tab}</button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => <button key={tab} onClick={() => setStatusFilter(tab)} className={`btn-base btn-neutral px-3 py-1.5 text-xs ${statusFilter === tab ? "border-[var(--accent-primary)]" : ""}`}>{tab}</button>)}
            <button className="btn-base btn-neutral px-3 py-1.5 text-xs" onClick={async () => { await markAllNotificationsRead(token); emitNotificationChanged({ type: "mark-all-read" }); load(); }}>Mark all read</button>
            <button
              className="btn-base btn-danger px-3 py-1.5 text-xs"
              onClick={async () => {
                const previous = items;
                setItems([]);
                try {
                  await clearAllNotifications(token);
                  emitNotificationChanged({ type: "clear-all" });
                  await load();
                  setError("");
                } catch (clearErr) {
                  setItems(previous);
                  setError(clearErr?.message || "Failed to clear notifications.");
                }
              }}
            >
              Clear all
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Notification preferences" description="Control reminders, digest frequency, and quiet hours.">
          {preferences ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">Platform <input type="checkbox" checked={preferences.platformEnabled} onChange={(e) => savePreference({ platformEnabled: e.target.checked })} /></label>
              <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">Revision <input type="checkbox" checked={preferences.revisionEnabled} onChange={(e) => savePreference({ revisionEnabled: e.target.checked })} /></label>
              <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">Alarms <input type="checkbox" checked={preferences.alarmEnabled} onChange={(e) => savePreference({ alarmEnabled: e.target.checked })} /></label>
              <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">Streak alerts <input type="checkbox" checked={preferences.streakProtectionEnabled} onChange={(e) => savePreference({ streakProtectionEnabled: e.target.checked })} /></label>
              <label className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">Weak-topic alerts <input type="checkbox" checked={preferences.weakTopicAlertsEnabled} onChange={(e) => savePreference({ weakTopicAlertsEnabled: e.target.checked })} /></label>
              <label className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-sm">Digest
                <select className="field-base mt-2 w-full" value={preferences.digestFrequency || "daily"} onChange={(e) => savePreference({ digestFrequency: e.target.value })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="off">Off</option>
                </select>
              </label>
            </div>
          ) : <p className="meta-text">Loading preferences…</p>}
        </SurfaceCard>

        {loading ? <p>Loading…</p> : null}
        {error ? <p className="text-sm text-[var(--accent-danger)]">{error}</p> : null}
        <div className="space-y-3">
          {items.map((item) => (
            <NotificationItemCard
              key={item.id}
              item={item}
              onOpen={(entry) => entry.actionUrl && navigateTo(entry.actionUrl)}
              onRead={async (id) => { await markNotificationRead(token, id); emitNotificationChanged({ type: "read", id }); load(); }}
              onDone={async (id) => { await markNotificationDone(token, id); emitNotificationChanged({ type: "done", id }); load(); }}
              onSnooze={async (id, minutes) => { await snoozeNotification(token, id, minutes); emitNotificationChanged({ type: "snooze", id }); load(); }}
              onReschedule={async (id) => {
                const input = window.prompt("Reschedule to (ISO date/time)", new Date(Date.now() + 3600_000).toISOString());
                if (!input) return;
                await rescheduleNotification(token, id, new Date(input).toISOString());
                emitNotificationChanged({ type: "reschedule", id });
                load();
              }}
              onDismiss={async (id) => { await dismissNotification(token, id); emitNotificationChanged({ type: "dismiss", id }); load(); }}
              onArchive={async (id) => { await archiveNotification(token, id); emitNotificationChanged({ type: "archive", id }); load(); }}
              onDelete={async (id) => {
                const previous = items;
                setItems((current) => current.filter((entry) => entry.id !== id));
                try {
                  await deleteNotification(token, id);
                  emitNotificationChanged({ type: "delete", id });
                  setError("");
                } catch (deleteErr) {
                  setItems(previous);
                  setError(deleteErr?.message || "Failed to delete notification.");
                }
              }}
            />
          ))}
          {!loading && items.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-8 text-center text-[var(--text-tertiary)]">No notifications found.</div> : null}
        </div>
      </div>
    </AppShell>
  );
}

export default NotificationsPage;
