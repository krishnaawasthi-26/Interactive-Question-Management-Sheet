import { getCurrentHashRoute, navigateTo, ROUTES } from "../services/hashRouter";

const navLinks = [
  { label: "My Sheets", route: ROUTES.PROFILE, icon: "📚" },
  { label: "Public Sheets", route: ROUTES.ABOUT, icon: "🌐" },
  { label: "Learning Insights", route: ROUTES.LEARNING_INSIGHTS, icon: "📈" },
  { label: "How To Use", route: ROUTES.HOW_TO_USE, icon: "🧭" },
  { label: "Contact", route: ROUTES.CONTACT, icon: "✉️" },
];

function AppSidebar() {
  const currentRoute = getCurrentHashRoute().route;

  return (
    <>
      <nav className="panel mb-4 p-3 lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">IQMS</p>
          <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="btn-base btn-neutral px-3 py-1 text-xs">
            LeetCode
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {navLinks.map((link) => {
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
          {navLinks.map((link) => {
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
          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-subtle)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
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
