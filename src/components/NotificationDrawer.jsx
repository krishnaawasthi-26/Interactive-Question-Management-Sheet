import { useMemo, useState } from "react";

const fmt = (value) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString();
};

function NotificationItem({ item, onOpen, onRead, onDone, onSnooze }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
          {item.subtitle ? <p className="text-xs text-[var(--text-secondary)]">{item.subtitle}</p> : null}
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">{item.meta}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Type: {item.group}</p>
        </div>
        {item.openable ? <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onOpen(item)}>Open</button> : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {item.readable ? <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onRead(item.id)}>Mark read</button> : null}
        {item.doneable ? <button className="btn-success px-2 py-1 text-xs" onClick={() => onDone(item.id)}>Mark done</button> : null}
        {item.snoozable ? <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onSnooze(item.id, item.group)}>Snooze 30m</button> : null}
      </div>
    </div>
  );
}

function NotificationDrawer({
  open,
  loading,
  error,
  permissionState,
  sections,
  onEnablePermission,
  onOpenItem,
  onRead,
  onDone,
  onSnooze,
}) {
  const tabs = useMemo(
    () => [
      { key: "all", label: `All (${sections.all.length})` },
      { key: "promotional", label: `Promotional (${sections.promotional.length})` },
      { key: "alerts", label: `Alerts (${sections.alerts.length})` },
      { key: "alarms", label: `Alarms (${sections.alarms.length})` },
    ],
    [sections]
  );
  const [activeTab, setActiveTab] = useState("all");

  if (!open) return null;

  const items = sections[activeTab] || [];

  return (
    <div className="absolute left-0 top-12 z-50 w-[380px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notifications center</h3>
        {permissionState === "denied" ? <span className="text-xs text-[var(--danger-color)]">Permission denied</span> : null}
      </div>

      {permissionState === "default" && (
        <button className="btn-neutral mb-3 w-full py-2 text-xs" onClick={onEnablePermission}>Enable browser notifications</button>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`rounded-lg border px-2 py-1.5 text-xs ${activeTab === tab.key
              ? "border-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_15%,var(--surface-elevated))]"
              : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]"}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
        {loading ? <p className="text-sm text-[var(--text-tertiary)]">Loading notifications…</p> : null}
        {error ? <p className="text-sm text-[var(--danger-color)]">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-subtle)] p-5 text-center text-sm text-[var(--text-tertiary)]">No notifications in this section.</p>
        ) : null}

        {!loading && !error ? items.map((item) => (
          <NotificationItem key={`${item.group}-${item.id}`} item={item} onOpen={onOpenItem} onRead={onRead} onDone={onDone} onSnooze={onSnooze} />
        )) : null}
      </div>
    </div>
  );
}

export const mapServerNotification = (item) => {
  const category = item?.category || item?.type || "alert";
  const isPromo = category === "promotional";
  return {
    id: item.id,
    group: isPromo ? "promotional" : "alerts",
    title: item.title || (isPromo ? "Promotional update" : "Revision alert"),
    subtitle: item.sheetTitle ? `${item.sheetTitle}${item.revisionNumber ? ` · Revision ${item.revisionNumber}` : ""}` : null,
    meta: item.dueAt ? `Due: ${fmt(item.dueAt)}` : `Updated: ${fmt(item.updatedAt || item.createdAt)}`,
    status: item.status,
    link: item.link,
    openable: Boolean(item.link),
    readable: true,
    doneable: !isPromo,
    snoozable: !isPromo,
  };
};

export const mapAlarmNotification = (item) => ({
  id: item.id,
  group: "alarms",
  title: `${item.mode === "alarm" ? "Alarm" : "Reminder"}: ${item.topicTitle || "Topic"}`,
  subtitle: item.sheetLabel || "Topic scheduler",
  meta: `Scheduled for: ${fmt(item.scheduledFor)}`,
  status: item.completed ? "completed" : item.triggeredAt ? "due" : "scheduled",
  link: item.link,
  openable: Boolean(item.link),
  readable: false,
  doneable: false,
  snoozable: true,
});

export default NotificationDrawer;
