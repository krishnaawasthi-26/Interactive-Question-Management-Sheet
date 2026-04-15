import { useMemo } from "react";
import { getCurrentRoute, getUserProfileRoute, navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";

const sections = [
  {
    title: "Workspace",
    items: [
      { label: "Home", route: ROUTES.HOME, icon: "🏠" },
      { label: "My Sheets", route: ROUTES.APP, icon: "🗂️" },
      { label: "Profile", route: ROUTES.PROFILE, icon: "👤" },
      { label: "Insights", route: ROUTES.LEARNING_INSIGHTS, icon: "🗓️" },
      { label: "Buy Premium", route: ROUTES.PREMIUM, icon: "💎" },
      { label: "Inbox", route: ROUTES.NOTIFICATIONS, icon: "🔔", matchRoutes: [ROUTES.NOTIFICATIONS, ROUTES.ALERTS, ROUTES.ALARMS] },
    ],
  },
  {
    title: "Discover",
    items: [
      { label: "Public Sheets", route: ROUTES.PUBLIC_SHEETS, icon: "🌐" },
      { label: "How To Use", route: ROUTES.HOW_TO_USE, icon: "📘" },
      { label: "About", route: ROUTES.ABOUT, icon: "ℹ️" },
    ],
  },
];

function SidebarItem({ item, isOpen, active, onClick, showTooltip = true }) {
  return (
    <button
      type="button"
      aria-label={item.label}
      title={!isOpen ? item.label : undefined}
      onClick={onClick}
      className={`group relative flex w-full items-center rounded-xl border px-3 py-3 text-sm transition-all duration-200 ${
        isOpen ? "justify-start gap-3.5" : "justify-center"
      } ${
        active
          ? "border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_15%,var(--surface-elevated))] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
      }`}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center text-base leading-none" aria-hidden>{item.icon}</span>
      <span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${isOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
        {item.label}
      </span>

      {!isOpen && showTooltip ? (
        <span
          role="tooltip"
          aria-hidden="true"
          className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 z-[70] -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-elevated)_96%,black)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-0 shadow-xl ring-1 ring-black/5 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
        >
          {item.label}
        </span>
      ) : null}
    </button>
  );
}

function SidebarSection({ title, items, isOpen, currentRoute, onItemClick }) {
  return (
    <section className="space-y-2">
      <p
        className={`caption-text overflow-hidden whitespace-nowrap px-2.5 transition-all duration-200 ${
          isOpen ? "w-auto opacity-100" : "w-0 opacity-0"
        }`}
      >
        {title}
      </p>
      <div className="space-y-2">
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
  const sidebarWidth = useMemo(() => (isSidebarOpen ? "w-[260px]" : "w-[86px]"), [isSidebarOpen]);

  return (
    <>
      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      ) : null}
      <aside
        className={`fixed bottom-6 left-6 top-6 z-40 hidden overflow-visible rounded-[22px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,transparent),color-mix(in_srgb,var(--surface-elevated)_92%,transparent))] p-3.5 pl-4 text-[var(--text-primary)] shadow-2xl transition-all duration-300 lg:flex lg:flex-col ${sidebarWidth}`}
      >
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-lg text-[var(--accent-primary)]"
        >
          ☰
        </button>
        <div className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${isSidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
          <p className="eyebrow">Create Sheets</p>
          <p className="meta-text">DSA Productivity</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-visible pr-1">
        {sections.map((section) => (
          <SidebarSection
            key={section.title}
            title={section.title}
            items={section.items.map((item) => {
              if (item.route !== ROUTES.PROFILE) return item;
              return { ...item, route: getUserProfileRoute(currentUser?.username) };
            })}
            isOpen={isSidebarOpen}
            currentRoute={currentRoute}
          />
        ))}
      </nav>

      <div className="mt-4 space-y-2 border-t border-[var(--border-subtle)] pt-3.5">
        {currentUser ? (
          <>
            <SidebarItem item={{ label: "Edit Profile", icon: "✏️" }} isOpen={isSidebarOpen} active={currentRoute === ROUTES.EDIT_PROFILE} onClick={() => navigateTo(ROUTES.EDIT_PROFILE)} />
            <SidebarItem
              item={{ label: "Log Out", icon: "🚪" }}
              isOpen={isSidebarOpen}
              active={false}
              onClick={() => {
                logout();
                navigateTo(ROUTES.LOGIN);
              }}
            />
          </>
        ) : (
          <SidebarItem item={{ label: "Login", icon: "🔐" }} isOpen={isSidebarOpen} active={currentRoute === ROUTES.LOGIN} onClick={() => navigateTo(ROUTES.LOGIN)} />
        )}
      </div>
      </aside>

      <aside className={`fixed inset-y-0 left-0 z-[60] w-[min(86vw,320px)] overflow-y-auto border-r border-[var(--border-subtle)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,transparent),color-mix(in_srgb,var(--surface-elevated)_95%,transparent))] px-4 pb-5 pt-4 text-[var(--text-primary)] shadow-2xl transition-transform duration-300 lg:hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <p className="eyebrow">Create Sheets</p>
            <p className="meta-text">DSA Productivity</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="btn-base btn-outline btn-icon"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-5 pb-4">
          {sections.map((section) => (
            <SidebarSection
              key={`mobile-${section.title}`}
              title={section.title}
              items={section.items.map((item) => {
                if (item.route !== ROUTES.PROFILE) return item;
                return { ...item, route: getUserProfileRoute(currentUser?.username) };
              })}
              isOpen
              currentRoute={currentRoute}
              onItemClick={onCloseMobile}
            />
          ))}
        </nav>

        <div className="space-y-2 border-t border-[var(--border-subtle)] pt-3.5">
          {currentUser ? (
            <>
              <SidebarItem item={{ label: "Edit Profile", icon: "✏️" }} isOpen active={currentRoute === ROUTES.EDIT_PROFILE} showTooltip={false} onClick={() => { navigateTo(ROUTES.EDIT_PROFILE); onCloseMobile?.(); }} />
              <SidebarItem
                item={{ label: "Log Out", icon: "🚪" }}
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
            <SidebarItem item={{ label: "Login", icon: "🔐" }} isOpen showTooltip={false} active={currentRoute === ROUTES.LOGIN} onClick={() => { navigateTo(ROUTES.LOGIN); onCloseMobile?.(); }} />
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
