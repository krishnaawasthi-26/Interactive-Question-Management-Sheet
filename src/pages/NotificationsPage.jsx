import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import NotificationItemCard from "../components/ui/NotificationItemCard";
import SurfaceCard from "../components/ui/SurfaceCard";
import {
  archiveNotification,
  clearAllNotifications,
  deleteNotification,
  dismissNotification,
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationDone,
  markNotificationRead,
  rescheduleNotification,
  snoozeNotification,
  updateNotificationPreferences,
} from "../api/notificationApi";
import { emitNotificationChanged, subscribeNotificationChanged } from "../services/notificationEvents";
import { navigateTo } from "../services/routes";
import { sortNotificationsLatestFirst } from "../services/reminderNotifications";
import { useAuthStore } from "../store/authStore";

const inboxTabs = [
  { key: "all", label: "All", queryTypes: ["platform", "revision"] },
  { key: "notifications", label: "Notifications", queryTypes: ["platform"] },
  { key: "alerts", label: "Alerts", queryTypes: ["revision"] },
  { key: "archived", label: "Archived", queryTypes: ["platform", "revision"], forceStatus: "archived" },
];

function NotificationsPage({ theme, onThemeChange, title = "Inbox" }) {
  const token = useAuthStore((s) => s.currentUser?.token);
  const userLabel = useAuthStore((s) => s.currentUser?.username || "Account");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inboxFilter, setInboxFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [preferences, setPreferences] = useState(null);
  const [error, setError] = useState("");

  const activeTab = useMemo(
    () => inboxTabs.find((tab) => tab.key === inboxFilter) || inboxTabs[0],
    [inboxFilter],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = { size: 150 };
      const requestedStatus = activeTab.forceStatus || statusFilter;
      if (requestedStatus !== "all") params.status = requestedStatus;
      const [data, prefs] = await Promise.all([
        fetchNotifications(token, params),
        fetchNotificationPreferences(token),
      ]);
      const source = sortNotificationsLatestFirst(Array.isArray(data) ? data : []);
      const filtered = source.filter((entry) => activeTab.queryTypes.includes(entry.type));
      setItems(filtered);
      setPreferences(prefs || null);
      setError("");
    } catch (loadErr) {
      setError(loadErr?.message || "Failed to load inbox.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeNotificationChanged(() => load()), [load]);

  const savePreference = async (patch) => {
    if (!token) return;
    const next = await updateNotificationPreferences(token, patch);
    setPreferences(next);
  };

  const statusTabs = ["all", "unread", "due", "overdue", "completed", "archived"];

  const summary = useMemo(() => {
    const unread = items.filter((item) => ["unread", "overdue", "due"].includes(item.status)).length;
    const archived = items.filter((item) => item.status === "archived").length;
    return { total: items.length, unread, archived };
  }, [items]);

  return (
    <AppShell
      title={title}
      subtitle="Unified center for notifications and alerts."
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={userLabel}
    >
      <div className="space-y-4">
        <SurfaceCard
          title="Inbox"
          description="Review updates, triage alerts, and keep communication clean."
          actions={(
            <div className="inbox-summary">
              <span>{summary.total} total</span>
              <span>{summary.unread} unread</span>
              <span>{summary.archived} archived</span>
            </div>
          )}
        >
          <div className="inbox-tab-row" role="tablist" aria-label="Inbox filters">
            {inboxTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setInboxFilter(tab.key);
                  if (tab.forceStatus) setStatusFilter(tab.forceStatus);
                }}
                role="tab"
                aria-selected={inboxFilter === tab.key}
                className={`inbox-tab ${inboxFilter === tab.key ? "is-active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`btn-base btn-neutral btn-sm lowercase ${statusFilter === tab ? "border-[var(--accent-primary)] text-[var(--accent-primary)]" : ""}`}
                disabled={Boolean(activeTab.forceStatus) && activeTab.forceStatus !== tab}
              >
                {tab}
              </button>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Inbox actions"
          description="Bulk triage without leaving this page."
          actions={(
            <button className="btn-base btn-primary btn-sm" onClick={async () => { await markAllNotificationsRead(token); emitNotificationChanged({ type: "mark-all-read" }); load(); }}>
              Mark all read
            </button>
          )}
        >
          <div className="flex flex-wrap gap-2">
            <button className="btn-base btn-neutral btn-sm" onClick={() => setStatusFilter("all")}>Reset filters</button>
            <button className="btn-base btn-danger btn-sm" onClick={async () => {
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
            }}>
              Clear inbox
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Preferences" description="Control what enters your inbox.">
          {preferences ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              <label className="inbox-preference-row">Platform <input type="checkbox" checked={preferences.platformEnabled} onChange={(e) => savePreference({ platformEnabled: e.target.checked })} /></label>
              <label className="inbox-preference-row">Revision alerts <input type="checkbox" checked={preferences.revisionEnabled} onChange={(e) => savePreference({ revisionEnabled: e.target.checked })} /></label>
              <label className="inbox-preference-row">Streak alerts <input type="checkbox" checked={preferences.streakProtectionEnabled} onChange={(e) => savePreference({ streakProtectionEnabled: e.target.checked })} /></label>
              <label className="inbox-preference-row">Weak-topic alerts <input type="checkbox" checked={preferences.weakTopicAlertsEnabled} onChange={(e) => savePreference({ weakTopicAlertsEnabled: e.target.checked })} /></label>
              <label className="inbox-preference-row">Digest
                <select className="field-base mt-1.5 w-full" value={preferences.digestFrequency || "daily"} onChange={(e) => savePreference({ digestFrequency: e.target.value })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="off">Off</option>
                </select>
              </label>
            </div>
          ) : <p className="meta-text">Loading preferences…</p>}
        </SurfaceCard>

        {loading ? <p className="meta-text">Loading inbox…</p> : null}
        {error ? <p className="text-sm text-[var(--accent-danger)]">{error}</p> : null}

        <div className="space-y-2.5">
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
          {!loading && items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✉</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">No inbox items match this filter.</p>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

export default NotificationsPage;
