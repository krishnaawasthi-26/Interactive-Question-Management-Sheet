function ActionButton({ action, variant = "neutral" }) {
  const variants = {
    primary: "bg-[var(--btn-accent-primary)] text-white hover:opacity-95",
    danger: "border border-[var(--danger-color)]/45 text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10",
    neutral: "border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]",
  };

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
    >
      {action.label}
    </button>
  );
}

function EditorActionPanel({ actions }) {
  const getAction = (key) => actions.find((action) => action.key === key);

  const history = [getAction("undo"), getAction("redo")].filter(Boolean);
  const commit = [getAction("save"), getAction("discard")].filter(Boolean);
  const transfers = [getAction("import"), getAction("export"), getAction("view-only")].filter(Boolean);

  return (
    <aside className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/95 p-4 shadow-lg">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Editor Tools</h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Contextual actions for this sheet.</p>

      <section className="mt-4 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">History</p>
        {history.map((action) => (
          <ActionButton key={action.key} action={action} />
        ))}
      </section>

      <section className="mt-5 space-y-2 border-t border-[var(--border-subtle)] pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Publish</p>
        {commit.map((action) => (
          <ActionButton key={action.key} action={action} variant={action.key === "save" ? "primary" : "danger"} />
        ))}
      </section>

      <section className="mt-5 space-y-2 border-t border-[var(--border-subtle)] pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">Data & mode</p>
        {transfers.map((action) => (
          <ActionButton key={action.key} action={action} />
        ))}
      </section>
    </aside>
  );
}

export default EditorActionPanel;
