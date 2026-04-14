import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import AlertBar from "./AlertBar";
import NotificationBell from "./NotificationBell";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div
      className="app-shell text-[var(--text-primary)]"
      style={{ "--sidebar-width": isSidebarOpen ? "250px" : "72px" }}
    >
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileOpen={isMobileNavOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
      <div className="app-content">
        <TopBar
          theme={theme}
          onThemeChange={onThemeChange}
          userLabel={userLabel}
          onMenuToggle={() => setIsMobileNavOpen((prev) => !prev)}
          actions={(
            <>
              <NotificationBell compact />
              {headerActions}
            </>
          )}
        />
        <div className="mx-auto w-full max-w-[1400px]">
          <AlertBar message={alert} onDismiss={onDismissAlert} />

          {title ? (
            <header className="panel-elevated mb-6 px-4 py-4 sm:px-5">
              <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">{title}</h1>
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
