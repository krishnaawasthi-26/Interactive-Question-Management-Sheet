function AlertBar({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,var(--surface-elevated))] px-4 py-2.5 text-sm text-[var(--text-primary)]">
      <span>{message}</span>
      {onDismiss ? (
        <button type="button" className="btn-base btn-neutral px-2 py-1 text-xs" onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

export default AlertBar;
