import { getCurrentRoute, navigateTo, ROUTES } from "../services/routes";

const primaryLinks = [
  { label: "Home", route: ROUTES.HOME, icon: "🏠" },
  { label: "Profile", route: ROUTES.PROFILE, icon: "👤" },
  { label: "My Sheets", route: ROUTES.APP, icon: "📚" },
  { label: "Public Sheets", route: ROUTES.PUBLIC_SHEETS, icon: "🌐" },
  { label: "Learning Insights", route: ROUTES.LEARNING_INSIGHTS, icon: "📈" },
];

const supportLinks = [
  { label: "About Us", route: ROUTES.ABOUT, icon: "ℹ️" },
  { label: "How To Use", route: ROUTES.HOW_TO_USE, icon: "🧭" },
  { label: "Contact", route: ROUTES.CONTACT, icon: "✉️" },
];

function NavGroup({ title, links, currentRoute }) {
  return (
    <div className="space-y-1.5">
      <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{title}</p>
      {links.map((link) => {
        const active = currentRoute === link.route;
        return (
          <button
            key={link.route}
            type="button"
            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${active
              ? "border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_15%,var(--surface-elevated))] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"}`}
            onClick={() => navigateTo(link.route)}
          >
            <span aria-hidden>{link.icon}</span>
            <span>{link.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AppSidebar() {
  const currentRoute = getCurrentRoute().route;

  return (
    <>
      <nav className="panel mb-4 p-3 lg:hidden">
        <div className="mb-3 grid grid-cols-2 gap-2">
          {[...primaryLinks, ...supportLinks].map((link) => {
            const active = currentRoute === link.route;
            return (
              <button
                key={link.route}
                type="button"
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${active
                  ? "border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_16%,var(--surface-elevated))] text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                onClick={() => navigateTo(link.route)}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </nav>

      <aside className="fixed bottom-6 left-6 top-6 z-40 hidden w-56 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 lg:block">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">IQMS</p>
          <h1 className="mt-2 text-base font-semibold text-[var(--text-primary)]">Question Sheets</h1>
        </div>

        <div className="space-y-4">
          <NavGroup title="Sheets" links={primaryLinks} currentRoute={currentRoute} />
          <NavGroup title="Support" links={supportLinks} currentRoute={currentRoute} />

          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
          >
            <span aria-hidden>🧩</span>
            <span>LeetCode</span>
          </a>
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;
