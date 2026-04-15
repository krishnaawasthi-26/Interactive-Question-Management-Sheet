import { getNotificationState, getRelativeTime, isArchivedNotification, notificationTypeMeta, priorityClass } from "../../services/notificationUtils";

function NotificationItemCard({ item, onOpen, onRead, onDone, onDismiss, onArchive, onDelete, onSnooze, onReschedule }) {
  const typeMeta = notificationTypeMeta[item.type] || notificationTypeMeta.platform;
  const state = getNotificationState(item);
  const unread = state === "due" || state === "unread" || state === "overdue";
  const archived = isArchivedNotification(item);

  return (
    <article className={`inbox-row rounded-xl border p-3.5 ${unread ? "border-[color-mix(in_srgb,var(--accent-primary)_34%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--surface-elevated))]" : "border-[var(--border-subtle)] bg-[var(--surface-elevated)]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.11em]" style={{ color: typeMeta.tint }}>{typeMeta.icon} {typeMeta.label}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-[var(--text-primary)]">{item.title}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.message}</p>
          <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">{getRelativeTime(item.scheduledFor || item.createdAt)} • <span className={priorityClass[item.priority] || ""}>{item.priority || "medium"}</span> • {state}</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {item.actionUrl ? <button className="btn-base btn-neutral btn-sm" onClick={() => onOpen(item)}>View</button> : null}
        {!archived && (item.status === "unread" || item.status === "overdue") ? <button className="btn-base btn-neutral btn-sm" onClick={() => onRead(item.id)}>Read</button> : null}
        {!archived && item.type === "revision" ? <button className="btn-base btn-success btn-sm" onClick={() => onDone(item.id)}>Done</button> : null}
        {!archived && (item.type === "alarm" || item.type === "revision") ? <button className="btn-base btn-neutral btn-sm" onClick={() => onSnooze(item.id, 60)}>+1h</button> : null}
        {!archived && (item.type === "alarm" || item.type === "revision") ? <button className="btn-base btn-neutral btn-sm" onClick={() => onReschedule(item.id)}>Reschedule</button> : null}
        {!archived ? <button className="btn-base btn-neutral btn-sm" onClick={() => onDismiss(item.id)}>Dismiss</button> : null}
        {!archived ? <button className="btn-base btn-neutral btn-sm" onClick={() => onArchive(item.id)}>Archive</button> : null}
        <button className="btn-base btn-danger btn-sm" onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </article>
  );
}

export default NotificationItemCard;
