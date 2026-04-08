function TopHeader({ title, subtitle, theme = "dark", onThemeChange, userLabel = "Account", actions }) {
  return (
    <header className="panel-elevated mb-6 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
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
          <button type="button" className="btn-base btn-neutral">{userLabel}</button>
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
