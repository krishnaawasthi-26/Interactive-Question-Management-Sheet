import { navigateTo, ROUTES } from "../services/hashRouter";

const primaryLinks = [
  { label: "Profile", route: ROUTES.PROFILE },
  { label: "About", route: ROUTES.ABOUT },
  { label: "How To Use", route: ROUTES.HOW_TO_USE },
  { label: "Contact", route: ROUTES.CONTACT },
  { label: "Learning Insights", route: ROUTES.LEARNING_INSIGHTS },
];

function SiteNav() {
  return (
    <>
      <nav className="mb-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/90 p-3 lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">IQMS</p>
          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-muted)]"
          >
            LeetCode
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {primaryLinks.map((link) => (
            <button
              key={link.route}
              type="button"
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/55 px-3 py-2 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-elevated)]"
              onClick={() => navigateTo(link.route)}
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      <aside className="fixed left-6 top-6 bottom-6 z-40 hidden w-64 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)]/96 p-5 shadow-xl lg:block">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">IQMS</p>
          <h1 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">Question Sheets</h1>
        </div>

        <div className="space-y-1.5">
          {primaryLinks.map((link) => (
            <button
              key={link.route}
              type="button"
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
              onClick={() => navigateTo(link.route)}
            >
              {link.label}
            </button>
          ))}
          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noreferrer"
            className="mt-2 block w-full rounded-xl px-3 py-2.5 text-left text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
          >
            LeetCode
          </a>
        </div>
      </aside>
    </>
  );
}

export default SiteNav;
