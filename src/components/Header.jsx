function Header({ title, onTitleChange, userLabel = "Account" }) {
  return (
    <header className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/70 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--btn-accent-primary)]/30 text-lg">📘</div>
          <div className="min-w-0">
            <input
              value={title}
              onChange={(event) => onTitleChange?.(event.target.value)}
              className="w-full min-w-[220px] border-none bg-transparent p-0 text-2xl font-semibold tracking-tight text-[var(--text-primary)] outline-none"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">Draft • Last edited just now</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
          >
            {userLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
