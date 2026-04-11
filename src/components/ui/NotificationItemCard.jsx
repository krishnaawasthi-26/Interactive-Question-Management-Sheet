import { getNotificationState, getRelativeTime, notificationTypeMeta, priorityClass } from "../../services/notificationUtils";

function NotificationItemCard({ item, onOpen, onRead, onDone, onDismiss, onArchive, onSnooze, onReschedule }) {
  const typeMeta = notificationTypeMeta[item.type] || notificationTypeMeta.platform;
  const state = getNotificationState(item);
  const unread = state === "due" || state === "unread" || state === "overdue";

  return (
    <article className={`rounded-xl border p-3 ${unread ? "border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,var(--surface-elevated))]" : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs" style={{ color: typeMeta.tint }}>{typeMeta.icon} {typeMeta.label}</p>
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="text-xs text-[var(--text-secondary)]">{item.message}</p>
          <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{getRelativeTime(item.scheduledFor || item.createdAt)} • <span className={priorityClass[item.priority] || ""}>{item.priority || "medium"}</span> • {state}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {item.actionUrl ? <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => onOpen(item)}>Open</button> : null}
        {(item.status === "unread" || item.status === "overdue") ? <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => onRead(item.id)}>Read</button> : null}
        {item.type === "revision" ? <button className="btn-base btn-success px-2 py-1 text-xs" onClick={() => onDone(item.id)}>Done</button> : null}
        {(item.type === "alarm" || item.type === "revision") ? <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => onSnooze(item.id, 60)}>+1h</button> : null}
        {(item.type === "alarm" || item.type === "revision") ? <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => onReschedule(item.id)}>Reschedule</button> : null}
        <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => onDismiss(item.id)}>Dismiss</button>
        <button className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => onArchive(item.id)}>Archive</button>
      </div>
    </article>
  );
}

export default NotificationItemCard;
