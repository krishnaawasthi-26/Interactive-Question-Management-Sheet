import { useEffect, useId, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import AlertBar from "./AlertBar";
import NotificationBell from "./NotificationBell";
import { ROUTES } from "../services/routes";

const footerLinks = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Public Sheets", href: ROUTES.PUBLIC_SHEETS },
  { label: "Create DSA Sheet", href: ROUTES.APP },
  { label: "Premium", href: ROUTES.PREMIUM },
  { label: "Login", href: ROUTES.LOGIN },
  { label: "Signup", href: ROUTES.SIGNUP },
  { label: "Contact", href: ROUTES.CONTACT },
  { label: "Apply", href: "/apply" },
];

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
  const mobileSidebarId = useId();

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileNavOpen]);

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
          mobileSidebarId={mobileSidebarId}
        />

        <div className="app-content">
          <button
            type="button"
            aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileNavOpen}
            aria-controls={mobileSidebarId}
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            className="mobile-sidebar-toggle lg:hidden"
          >
            ☰
          </button>

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
            <footer className="mt-8 border-t border-[var(--border-subtle)] py-5">
              <nav aria-label="SEO footer links" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {footerLinks.map((link) => (
                  <a key={link.href} href={link.href} className="link-base">
                    {link.label}
                  </a>
                ))}
              </nav>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
