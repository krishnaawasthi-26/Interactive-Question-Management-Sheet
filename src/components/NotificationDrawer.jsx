import { useMemo, useState } from "react";
import NotificationItemCard from "./ui/NotificationItemCard";

function NotificationDrawer({ open, loading, error, permissionState, sections, onEnablePermission, onOpenItem, onRead, onDone, onDismiss, onArchive, onSnooze, onReschedule, onMarkAllRead }) {
  const [activeTab, setActiveTab] = useState("all");
  const tabs = useMemo(() => [
    ["all", "All"],
    ["platform", "Platform"],
    ["revision", "Revision"],
    ["alarm", "Alarms"],
    ["overdue", "Overdue"],
  ], []);

  if (!open) return null;
  const items = sections[activeTab] || [];

  return (
    <div className="absolute right-0 top-12 z-50 w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notification center</h3>
        <button className="text-xs text-[var(--accent-primary)]" onClick={onMarkAllRead}>Mark all read</button>
      </div>
      {permissionState === "default" ? <button className="btn-base btn-neutral mb-2 w-full py-2 text-xs" onClick={onEnablePermission}>Enable browser alerts</button> : null}
      {error ? <p className="mb-2 text-xs text-[var(--accent-danger)]">{error}</p> : null}

      <div className="mb-2 grid grid-cols-5 gap-2">
        {tabs.map(([key, label]) => <button key={key} onClick={() => setActiveTab(key)} className={`rounded-lg border px-2 py-1 text-xs ${activeTab === key ? "border-[var(--accent-primary)]" : "border-[var(--border-subtle)]"}`}>{label}</button>)}
      </div>

      <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
        {loading ? <p className="text-sm">Loading…</p> : null}
        {!loading && items.length === 0 ? <p className="rounded-lg border border-dashed border-[var(--border-subtle)] p-5 text-center text-sm text-[var(--text-tertiary)]">No notifications.</p> : null}
        {items.map((item) => <NotificationItemCard key={item.id} item={item} onOpen={onOpenItem} onRead={onRead} onDone={onDone} onDismiss={onDismiss} onArchive={onArchive} onSnooze={onSnooze} onReschedule={onReschedule} />)}
      </div>
    </div>
  );
}

export default NotificationDrawer;
