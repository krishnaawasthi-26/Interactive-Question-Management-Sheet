import { useMemo } from "react";

const fmt = (value) => new Date(value).toLocaleString();

function NotificationItem({ item, onOpen, onRead, onDone, onSnooze }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
          <p className="text-xs text-[var(--text-secondary)]">{item.sheetTitle} · Revision {item.revisionNumber}</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">Due: {fmt(item.dueAt)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Status: {item.status}</p>
        </div>
        <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onOpen(item)}>Open</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onRead(item.id)}>Mark read</button>
        <button className="btn-success px-2 py-1 text-xs" onClick={() => onDone(item.id)}>Mark done</button>
        <button className="btn-neutral px-2 py-1 text-xs" onClick={() => onSnooze(item.id)}>Snooze 30m</button>
      </div>
    </div>
  );
}

function Section({ title, items, ...handlers }) {
  if (!items.length) return null;
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{title}</h4>
      <div className="space-y-2">{items.map((item) => <NotificationItem key={item.id} item={item} {...handlers} />)}</div>
    </section>
  );
}

function NotificationDrawer({ open, loading, error, permissionState, notifications, onEnablePermission, onOpenItem, onRead, onDone, onSnooze }) {
  const groups = useMemo(() => {
    const now = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return notifications.reduce(
      (acc, item) => {
        const dueAt = new Date(item.dueAt).getTime();
        if (["completed", "read"].includes(item.status)) acc.completed.push(item);
        else if (item.status === "due" || dueAt <= now) acc.dueNow.push(item);
        else if (dueAt <= endOfToday.getTime()) acc.today.push(item);
        else acc.upcoming.push(item);
        return acc;
      },
      { dueNow: [], today: [], upcoming: [], completed: [] }
    );
  }, [notifications]);

  if (!open) return null;

  return (
    <div className="absolute left-0 top-12 z-50 w-[360px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Revision notifications</h3>
        {permissionState === "denied" ? (
          <span className="text-xs text-[var(--danger-color)]">Permission denied</span>
        ) : null}
      </div>

      {permissionState === "default" && (
        <button className="btn-neutral mb-3 w-full py-2 text-xs" onClick={onEnablePermission}>Enable browser notifications</button>
      )}

      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        {loading ? <p className="text-sm text-[var(--text-tertiary)]">Loading notifications…</p> : null}
        {error ? <p className="text-sm text-[var(--danger-color)]">{error}</p> : null}
        {!loading && !error && notifications.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-subtle)] p-5 text-center text-sm text-[var(--text-tertiary)]">No revision notifications yet.</p>
        ) : null}

        {!loading && !error ? (
          <>
            <Section title="Due now" items={groups.dueNow} onOpen={onOpenItem} onRead={onRead} onDone={onDone} onSnooze={onSnooze} />
            <Section title="Today" items={groups.today} onOpen={onOpenItem} onRead={onRead} onDone={onDone} onSnooze={onSnooze} />
            <Section title="Upcoming" items={groups.upcoming} onOpen={onOpenItem} onRead={onRead} onDone={onDone} onSnooze={onSnooze} />
            <Section title="Completed / read" items={groups.completed} onOpen={onOpenItem} onRead={onRead} onDone={onDone} onSnooze={onSnooze} />
          </>
        ) : null}
      </div>
    </div>
  );
}

export default NotificationDrawer;
