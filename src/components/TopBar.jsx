function TopBar({ theme = "dark", onThemeChange, userLabel = "Account", actions, onMenuToggle }) {
  return (
    <header className="panel-elevated mb-4 px-4 py-2.5 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="btn-base btn-outline btn-icon lg:hidden"
            aria-label="Open navigation menu"
          >
            ☰
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_16%,transparent),var(--surface))] text-xs">📘</div>
          <div className="min-w-0">
            <p className="eyebrow">Create Sheets Workspace</p>
            <p className="truncate text-sm text-[var(--text-secondary)]">Focused interview-prep operating system</p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          {actions}
          {onThemeChange ? (
            <select
              aria-label="Theme"
              value={theme}
              onChange={(event) => onThemeChange(event.target.value)}
              className="field-base min-h-[34px] py-1.5 text-sm sm:w-auto"
            >
              <option value="dark">Dark</option>
              <option value="night">Night</option>
              <option value="light">Light</option>
            </select>
          ) : null}
          <button type="button" className="btn-base btn-neutral max-w-full truncate px-3 py-1.5 text-xs font-medium sm:max-w-40">{userLabel}</button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
