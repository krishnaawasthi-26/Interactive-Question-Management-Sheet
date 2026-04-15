import { useMemo } from "react";
import { getCurrentRoute, getUserProfileRoute, navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";

const sections = [
  {
    title: "Workspace",
    items: [
      { label: "Home", route: ROUTES.HOME, icon: "⌂" },
      { label: "Sheets", route: ROUTES.APP, icon: "▦" },
      { label: "Profile", route: ROUTES.PROFILE, icon: "◉" },
      { label: "Premium", route: ROUTES.PREMIUM, icon: "✦" },
      { label: "Inbox", route: ROUTES.NOTIFICATIONS, icon: "✉", matchRoutes: [ROUTES.NOTIFICATIONS, ROUTES.ALERTS] },
      { label: "Reminders", route: ROUTES.ALARMS, icon: "⏱" },
    ],
  },
  {
    title: "Discover",
    items: [
      { label: "Insights", route: ROUTES.LEARNING_INSIGHTS, icon: "◌" },
      { label: "Public Sheets", route: ROUTES.PUBLIC_SHEETS, icon: "◎" },
      { label: "How To Use", route: ROUTES.HOW_TO_USE, icon: "?" },
      { label: "About", route: ROUTES.ABOUT, icon: "i" },
    ],
  },
];

function SidebarItem({ item, isOpen, active, onClick, showTooltip = true, compact = false }) {
  return (
    <button
      type="button"
      aria-label={item.label}
      title={!isOpen ? item.label : undefined}
      onClick={onClick}
      className={`sidebar-nav-item group ${active ? "is-active" : ""} ${compact ? "is-compact" : ""}`.trim()}
    >
      <span className="sidebar-nav-icon" aria-hidden>{item.icon}</span>
      <span className={`sidebar-nav-label ${isOpen ? "is-visible" : ""}`}>{item.label}</span>

      {!isOpen && showTooltip ? (
        <span role="tooltip" aria-hidden="true" className="sidebar-tooltip">
          {item.label}
        </span>
      ) : null}
    </button>
  );
}

function SidebarSection({ title, items, isOpen, currentRoute, onItemClick }) {
  return (
    <section className="space-y-1.5">
      <p className={`caption-text sidebar-section-title ${isOpen ? "is-visible" : ""}`}>{title}</p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <SidebarItem
            key={`${title}-${item.label}`}
            item={item}
            isOpen={isOpen}
            active={item.matchRoutes ? item.matchRoutes.includes(currentRoute) : currentRoute === item.route}
            onClick={() => {
              navigateTo(item.route);
              onItemClick?.();
            }}
          />
        ))}
      </div>
    </section>
  );
}

function Sidebar({ isSidebarOpen, isMobileOpen = false, onToggle, onCloseMobile }) {
  const currentRoute = getCurrentRoute().route;
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const sidebarWidth = useMemo(
    () => (isSidebarOpen ? "sidebar-desktop-expanded" : "sidebar-desktop-collapsed"),
    [isSidebarOpen],
  );

  const resolvedSections = useMemo(
    () => sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.route !== ROUTES.PROFILE) return item;
        return { ...item, route: getUserProfileRoute(currentUser?.username) };
      }),
    })),
    [currentUser?.username],
  );

  return (
    <>
      {isMobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      ) : null}

      <aside
        className={`sidebar-desktop ${sidebarWidth}`}
      >
        <div className="sidebar-desktop-header">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="sidebar-toggle"
          >
            <span className={`transition-transform duration-200 ${isSidebarOpen ? "rotate-180" : ""}`}>❮</span>
          </button>
          <div className={`sidebar-brand ${isSidebarOpen ? "is-visible" : ""}`}>
            <p className="eyebrow">IQMS</p>
            <p className="meta-text">Create Sheets</p>
          </div>
        </div>

        <nav className="sidebar-scroll space-y-5">
          {resolvedSections.map((section) => (
            <SidebarSection
              key={section.title}
              title={section.title}
              items={section.items}
              isOpen={isSidebarOpen}
              currentRoute={currentRoute}
            />
          ))}
        </nav>

        <div className="mt-4 space-y-1.5 border-t border-[var(--border-subtle)] pt-3">
          {currentUser ? (
            <>
              <SidebarItem item={{ label: "Edit Profile", icon: "✎" }} isOpen={isSidebarOpen} active={currentRoute === ROUTES.EDIT_PROFILE} onClick={() => navigateTo(ROUTES.EDIT_PROFILE)} />
              <SidebarItem
                item={{ label: "Log Out", icon: "↗" }}
                isOpen={isSidebarOpen}
                active={false}
                onClick={() => {
                  logout();
                  navigateTo(ROUTES.LOGIN);
                }}
              />
            </>
          ) : (
            <SidebarItem item={{ label: "Login", icon: "→" }} isOpen={isSidebarOpen} active={currentRoute === ROUTES.LOGIN} onClick={() => navigateTo(ROUTES.LOGIN)} />
          )}
        </div>
      </aside>

      <aside className={`sidebar-mobile lg:hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="sidebar-desktop-header">
          <div className="sidebar-brand is-visible">
            <p className="eyebrow">IQMS</p>
            <p className="meta-text">Create Sheets</p>
          </div>
          <button type="button" onClick={onCloseMobile} aria-label="Close navigation" className="sidebar-toggle">✕</button>
        </div>

        <nav className="sidebar-scroll space-y-5 pb-4">
          {resolvedSections.map((section) => (
            <SidebarSection
              key={`mobile-${section.title}`}
              title={section.title}
              items={section.items}
              isOpen
              currentRoute={currentRoute}
              onItemClick={onCloseMobile}
            />
          ))}
        </nav>

        <div className="space-y-1.5 border-t border-[var(--border-subtle)] pt-3">
          {currentUser ? (
            <>
              <SidebarItem item={{ label: "Edit Profile", icon: "✎" }} isOpen showTooltip={false} active={currentRoute === ROUTES.EDIT_PROFILE} onClick={() => { navigateTo(ROUTES.EDIT_PROFILE); onCloseMobile?.(); }} />
              <SidebarItem
                item={{ label: "Log Out", icon: "↗" }}
                isOpen
                showTooltip={false}
                active={false}
                onClick={() => {
                  logout();
                  navigateTo(ROUTES.LOGIN);
                  onCloseMobile?.();
                }}
              />
            </>
          ) : (
            <SidebarItem item={{ label: "Login", icon: "→" }} isOpen showTooltip={false} active={currentRoute === ROUTES.LOGIN} onClick={() => { navigateTo(ROUTES.LOGIN); onCloseMobile?.(); }} />
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
