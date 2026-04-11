import { useMemo, useState } from "react";
import { getNotificationState, getRelativeTime, notificationTypeMeta, priorityClass } from "../services/notificationUtils";

function NotificationItem({ item, onOpen, onRead, onDone, onDismiss, onArchive, onSnooze }) {
  const typeMeta = notificationTypeMeta[item.type] || notificationTypeMeta.platform;
  const state = getNotificationState(item);
  const unread = state === "due" || state === "unread";

  return (
    <article className={`rounded-xl border p-3 ${unread ? "border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,var(--surface-elevated))]" : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs" style={{ color: typeMeta.tint }}>{typeMeta.icon} {typeMeta.label}</p>
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-xs text-[var(--text-secondary)]">{item.message}</p>
          <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{getRelativeTime(item.scheduledFor || item.createdAt)} • <span className={priorityClass[item.priority] || ""}>{item.priority || "medium"}</span></p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {item.actionUrl ? <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onOpen(item)}>Open</button> : null}
        {item.status === "unread" ? <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onRead(item.id)}>Read</button> : null}
        {item.type === "revision" ? <button className="btn-success px-2 py-1 text-xs" onClick={() => onDone(item.id)}>Done</button> : null}
        {(item.type === "alarm" || item.type === "revision") ? <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onSnooze(item.id, 60)}>+1h</button> : null}
        <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onDismiss(item.id)}>Dismiss</button>
        <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onArchive(item.id)}>Archive</button>
      </div>
    </article>
  );
}

function NotificationDrawer({ open, loading, error, permissionState, sections, onEnablePermission, onOpenItem, onRead, onDone, onDismiss, onArchive, onSnooze, onMarkAllRead }) {
  const [activeTab, setActiveTab] = useState("all");
  const tabs = useMemo(() => [
    ["all", "All"],
    ["platform", "Platform"],
    ["revision", "Revision"],
    ["alarm", "Alarms"],
  ], []);

  if (!open) return null;
  const items = sections[activeTab] || [];

  return (
    <div className="absolute right-0 top-12 z-50 w-[420px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notification center</h3>
        <button className="text-xs text-[var(--accent-info)]" onClick={onMarkAllRead}>Mark all read</button>
      </div>
      {permissionState === "default" ? <button className="btn-neutral mb-2 w-full py-2 text-xs" onClick={onEnablePermission}>Enable browser alerts</button> : null}
      {error ? <p className="mb-2 text-xs text-[var(--accent-danger)]">{error}</p> : null}

      <div className="mb-2 grid grid-cols-4 gap-2">
        {tabs.map(([key, label]) => <button key={key} onClick={() => setActiveTab(key)} className={`rounded-lg border px-2 py-1 text-xs ${activeTab === key ? "border-[var(--accent-primary)]" : "border-[var(--border-subtle)]"}`}>{label}</button>)}
      </div>

      <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
        {loading ? <p className="text-sm">Loading…</p> : null}
        {!loading && items.length === 0 ? <p className="rounded-lg border border-dashed border-[var(--border-subtle)] p-5 text-center text-sm text-[var(--text-tertiary)]">No notifications.</p> : null}
        {items.map((item) => <NotificationItem key={item.id} item={item} onOpen={onOpenItem} onRead={onRead} onDone={onDone} onDismiss={onDismiss} onArchive={onArchive} onSnooze={onSnooze} />)}
      </div>
    </div>
  );
}

export default NotificationDrawer;
