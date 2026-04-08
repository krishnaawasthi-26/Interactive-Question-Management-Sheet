import { getCurrentRoute, navigateTo, ROUTES } from "../services/routes";

const primaryLinks = [
  { label: "Profile", route: ROUTES.PROFILE, icon: "👤" },
  { label: "About", route: ROUTES.ABOUT, icon: "ℹ️" },
  { label: "How To Use", route: ROUTES.HOW_TO_USE, icon: "🧭" },
  { label: "Contact", route: ROUTES.CONTACT, icon: "✉️" },
  { label: "Learning Insights", route: ROUTES.LEARNING_INSIGHTS, icon: "📊" },
];

function SiteNav() {
  const currentRoute = getCurrentRoute().route;

  return (
    <>
      <nav className="panel mb-4 p-3 lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">IQMS</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {primaryLinks.map((link) => {
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

      <aside className="fixed bottom-6 left-6 top-6 z-40 hidden w-64 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 lg:block">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">IQMS</p>
          <h1 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">Question Sheets</h1>
        </div>

        <div className="space-y-1.5">
          {primaryLinks.map((link) => {
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
      </aside>
    </>
  );
}

export default SiteNav;
