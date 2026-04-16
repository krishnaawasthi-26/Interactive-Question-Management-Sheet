import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import AlertBar from "./AlertBar";
import NotificationBell from "./NotificationBell";

function AppShell({
  title,
  subtitle,
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
    <div className="app-shell text-[var(--text-primary)]">
      <div
        className="app-shell-grid"
        style={{
          "--sidebar-collapsed-width": "88px",
          "--sidebar-expanded-width": "252px",
          "--sidebar-width": isSidebarOpen ? "var(--sidebar-expanded-width)" : "var(--sidebar-collapsed-width)",
        }}
      >
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          isMobileOpen={isMobileNavOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        <div className="app-content">
          <TopBar
            userLabel={userLabel}
            actions={(
              <>
                <div className="flex-none">
                  <NotificationBell compact />
                </div>
                {headerActions}
              </>
            )}
          />
          <div className="mx-auto w-full max-w-[var(--content-max-width)] px-0 lg:px-2">
            <AlertBar message={alert} onDismiss={onDismissAlert} />

            {title ? (
              <header className="panel-elevated mb-5 px-4 py-4 sm:px-5">
                <h1 className="page-title">{title}</h1>
                {subtitle ? <p className="meta-text mt-1">{subtitle}</p> : null}
              </header>
            ) : null}

            <div className={`section-fade-in grid gap-5 ${rightPanel ? "xl:grid-cols-[minmax(0,1fr)_280px]" : ""}`}>
              <main className={contentClassName}>{children}</main>
              {rightPanel ? <aside className="xl:sticky xl:top-6 xl:h-fit">{rightPanel}</aside> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
