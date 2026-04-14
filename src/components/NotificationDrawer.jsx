import { useMemo, useState } from "react";
import NotificationItemCard from "./ui/NotificationItemCard";

function NotificationDrawer({ open, loading, error, permissionState, sections, onEnablePermission, onOpenItem, onRead, onDone, onDismiss, onArchive, onDelete, onSnooze, onReschedule, onMarkAllRead }) {
  const [activeTab, setActiveTab] = useState("active");
  const tabs = useMemo(() => [
    ["all", "All"],
    ["active", "Active"],
    ["archived", "Archived"],
  ], []);

  if (!open) return null;
  const items = sections[activeTab] || [];

  return (
    <div className="fixed inset-x-3 top-16 z-50 max-h-[78dvh] w-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:max-h-none sm:w-[min(460px,92vw)]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Notification center</h3>
        <button className="text-xs text-[var(--accent-primary)]" onClick={onMarkAllRead}>Mark all read</button>
      </div>
      {permissionState === "default" ? <button className="btn-base btn-neutral mb-2 w-full py-2 text-xs" onClick={onEnablePermission}>Enable browser alerts</button> : null}
      {error ? <p className="mb-2 text-xs text-[var(--accent-danger)]">{error}</p> : null}

      <div className="mb-2 grid grid-cols-3 gap-2">
        {tabs.map(([key, label]) => <button key={key} onClick={() => setActiveTab(key)} className={`rounded-lg border px-2 py-1 text-xs ${activeTab === key ? "border-[var(--accent-primary)]" : "border-[var(--border-subtle)]"}`}>{label}</button>)}
      </div>

      <div className="max-h-[58dvh] space-y-2 overflow-y-auto pr-1 sm:max-h-[65vh]">
        {loading ? <p className="text-sm">Loading…</p> : null}
        {!loading && items.length === 0 ? <p className="rounded-lg border border-dashed border-[var(--border-subtle)] p-5 text-center text-sm text-[var(--text-tertiary)]">{activeTab === "archived" ? "No archived notifications." : "No active notifications."}</p> : null}
        {items.map((item) => (
          <NotificationItemCard
            key={item.id}
            item={item}
            onOpen={onOpenItem}
            onRead={onRead}
            onDone={onDone}
            onDismiss={onDismiss}
            onArchive={onArchive}
            onDelete={onDelete}
            onSnooze={onSnooze}
            onReschedule={onReschedule}
          />
        ))}
      </div>
    </div>
  );
}

export default NotificationDrawer;
