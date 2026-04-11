function TopBar({ theme = "dark", onThemeChange, userLabel = "Account", actions }) {
  return (
    <header className="panel-elevated mb-4 px-4 py-3 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-sm">📘</div>
          <div className="min-w-0">
            <p className="eyebrow">IQMS Workspace</p>
            <p className="truncate text-sm text-[var(--text-secondary)]">Interactive Question Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {onThemeChange ? (
            <select
              aria-label="Theme"
              value={theme}
              onChange={(event) => onThemeChange(event.target.value)}
              className="field-base py-2"
            >
              <option value="dark">Dark</option>
              <option value="night">Night</option>
              <option value="light">Light</option>
            </select>
          ) : null}
          <button type="button" className="btn-base btn-neutral max-w-44 truncate px-3">{userLabel}</button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
