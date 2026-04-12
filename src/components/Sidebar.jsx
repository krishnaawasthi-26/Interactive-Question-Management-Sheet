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
      { label: "Notifications", route: ROUTES.NOTIFICATIONS, icon: "🔔" },
      { label: "Alerts", route: ROUTES.ALERTS, icon: "📚" },
      { label: "Alarm", route: ROUTES.ALARMS, icon: "⏰" },
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

function SidebarItem({ item, isOpen, active, onClick }) {
  return (
    <button
      type="button"
      aria-label={item.label}
      onClick={onClick}
      className={`group relative flex w-full items-center rounded-xl border px-2.5 py-2.5 text-sm transition-all duration-200 ${
        isOpen ? "justify-start gap-3" : "justify-center"
      } ${
        active
          ? "border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_15%,var(--surface-elevated))] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
      }`}
    >
      <span className="text-base" aria-hidden>{item.icon}</span>
      <span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${isOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
        {item.label}
      </span>

      {!isOpen ? (
        <span
          role="tooltip"
          aria-hidden="true"
          className="pointer-events-none absolute left-[calc(100%+0.65rem)] top-1/2 z-50 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-elevated)_96%,black)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
        >
          {item.label}
        </span>
      ) : null}
    </button>
  );
}

function SidebarSection({ title, items, isOpen, currentRoute }) {
  return (
    <section className="space-y-1.5">
      <p
        className={`caption-text overflow-hidden whitespace-nowrap px-2 transition-all duration-200 ${
          isOpen ? "w-auto opacity-100" : "w-0 opacity-0"
        }`}
      >
        {title}
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <SidebarItem
            key={`${title}-${item.label}`}
            item={item}
            isOpen={isOpen}
            active={currentRoute === item.route}
            onClick={() => navigateTo(item.route)}
          />
        ))}
      </div>
    </section>
  );
}

function Sidebar({ isSidebarOpen, onToggle }) {
  const currentRoute = getCurrentRoute().route;
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const sidebarWidth = useMemo(() => (isSidebarOpen ? "w-[250px]" : "w-[72px]"), [isSidebarOpen]);

  return (
    <aside className={`fixed bottom-6 left-6 top-6 z-40 hidden overflow-visible rounded-[22px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,transparent),color-mix(in_srgb,var(--surface-elevated)_92%,transparent))] p-3 text-[var(--text-primary)] shadow-2xl transition-all duration-300 lg:flex lg:flex-col ${sidebarWidth}`}>
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
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

      <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
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

      <div className="mt-3 space-y-1.5 border-t border-[var(--border-subtle)] pt-3">
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
  );
}

export default Sidebar;
