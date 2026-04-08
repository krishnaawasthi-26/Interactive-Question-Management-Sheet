import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import AlertBar from "./AlertBar";

function AppShell({
  title,
  subtitle,
  theme,
  onThemeChange,
  userLabel,
  headerActions,
  rightPanel,
  alert,
  onDismissAlert,
  children,
  contentClassName = "",
}) {
  return (
    <div className="app-shell text-[var(--text-primary)]">
      <AppSidebar />
      <div className="app-content">
        <TopBar theme={theme} onThemeChange={onThemeChange} userLabel={userLabel} actions={headerActions} />
        <div className="mx-auto w-full max-w-[1400px]">
          <AlertBar message={alert} onDismiss={onDismissAlert} />

          {title ? (
            <header className="panel-elevated mb-6 px-5 py-4">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
            </header>
          ) : null}

          <div className={`grid gap-6 ${rightPanel ? "xl:grid-cols-[minmax(0,1fr)_280px]" : ""}`}>
            <main className={contentClassName}>{children}</main>
            {rightPanel ? <aside className="xl:sticky xl:top-6 xl:h-fit">{rightPanel}</aside> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
