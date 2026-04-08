function ActionButton({ action, variant = "neutral" }) {
  const variants = {
    primary: "btn-primary",
    success: "btn-success",
    danger: "btn-danger",
    neutral: "btn-neutral",
  };

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={`btn-base w-full text-left disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]}`}
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
    <aside className="panel p-4">
      <h2 className="text-sm font-semibold">Editor Tools</h2>
      <p className="mt-1 text-xs text-[var(--text-tertiary)]">Contextual sheet actions.</p>

      <section className="mt-4 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">History</p>
        {history.map((action) => <ActionButton key={action.key} action={action} />)}
      </section>

      <section className="mt-5 space-y-2 border-t border-[var(--border-subtle)] pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Save Controls</p>
        {commit.map((action) => (
          <ActionButton key={action.key} action={action} variant={action.key === "save" ? "success" : "danger"} />
        ))}
      </section>

      <section className="mt-5 space-y-2 border-t border-[var(--border-subtle)] pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Sheet Actions</p>
        {transfers.map((action) => <ActionButton key={action.key} action={action} />)}
      </section>
    </aside>
  );
}

export default EditorActionPanel;
