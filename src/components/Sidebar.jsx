import { useMemo } from "react";
import { getCurrentRoute, navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";

const sections = [
  {
    title: "Profile Tracker",
    items: [
      { label: "Home", route: ROUTES.HOME, icon: "🏠" },
      { label: "Portfolio", route: ROUTES.PROFILE, icon: "💼" },
      { label: "Company Wise Kit", route: ROUTES.PUBLIC_SHEETS, icon: "🏢" },
    ],
  },
  {
    title: "Question Tracker",
    items: [
      { label: "My Workspace", route: ROUTES.APP, icon: "🧩" },
      { label: "Explore Sheets", route: ROUTES.PUBLIC_SHEETS, icon: "🧭" },
      { label: "My Sheets", route: ROUTES.APP, icon: "📚" },
      { label: "Notes", route: ROUTES.IMPORT, icon: "📝" },
    ],
  },
  {
    title: "Event Tracker",
    items: [
      { label: "Contests", route: ROUTES.HOW_TO_USE, icon: "🏆" },
      { label: "Leaderboard", route: ROUTES.LEARNING_INSIGHTS, icon: "📈" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Help Center", route: ROUTES.CONTACT, icon: "💬" },
      { label: "Feedback", route: ROUTES.ABOUT, icon: "✉️" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "How To Use", route: ROUTES.HOW_TO_USE, icon: "❓" },
    ],
  },
];

function SidebarItem({ item, isOpen, active, onClick }) {
  return (
    <button
      type="button"
      title={!isOpen ? item.label : undefined}
      onClick={onClick}
      className={`group relative flex w-full items-center rounded-xl border px-2.5 py-2.5 text-sm transition-all duration-300 ${
        isOpen ? "justify-start gap-3" : "justify-center"
      } ${
        active
          ? "border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_16%,var(--surface-elevated))] text-[var(--accent-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
      }`}
    >
      <span className="text-base" aria-hidden>{item.icon}</span>
      <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
        {item.label}
      </span>

      {!isOpen ? (
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 py-1 text-xs text-[var(--text-primary)] opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
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
        className={`overflow-hidden whitespace-nowrap px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)] transition-all duration-300 ${
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
  const logout = useAuthStore((state) => state.logout);

  const sidebarWidth = useMemo(() => (isSidebarOpen ? "w-[250px]" : "w-[72px]"), [isSidebarOpen]);

  return (
    <aside className={`fixed bottom-6 left-6 top-6 z-40 hidden overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[#0e1525] p-3 text-[var(--text-primary)] shadow-lg transition-all duration-300 lg:flex lg:flex-col ${sidebarWidth}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-lg text-[var(--accent-primary)] transition hover:border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)]"
        >
          ☰
        </button>
        <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-primary)]">IQMS</p>
          <p className="text-xs text-[var(--text-secondary)]">Question Tracker</p>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto pr-1">
        {sections.map((section) => (
          <SidebarSection
            key={section.title}
            title={section.title}
            items={section.items}
            isOpen={isSidebarOpen}
            currentRoute={currentRoute}
          />
        ))}
      </nav>

      <div className="mt-3 space-y-1.5 border-t border-[var(--border-subtle)] pt-3">
        <SidebarItem
          item={{ label: "Edit Profile", icon: "✏️" }}
          isOpen={isSidebarOpen}
          active={currentRoute === ROUTES.EDIT_PROFILE}
          onClick={() => navigateTo(ROUTES.EDIT_PROFILE)}
        />
        <SidebarItem
          item={{ label: "Log Out", icon: "🚪" }}
          isOpen={isSidebarOpen}
          active={false}
          onClick={() => {
            logout();
            navigateTo(ROUTES.LOGIN);
          }}
        />
      </div>
    </aside>
  );
}

export default Sidebar;
