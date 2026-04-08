import { navigateTo, ROUTES } from "../services/hashRouter";

const primaryLinks = [
  { label: "Profile", route: ROUTES.PROFILE },
  { label: "About Us", route: ROUTES.ABOUT },
  { label: "How To Use", route: ROUTES.HOW_TO_USE },
  { label: "Contact Us", route: ROUTES.CONTACT },
  { label: "Learning Insights", route: ROUTES.LEARNING_INSIGHTS },
];

function SiteNav() {
  return (
    <>
      <nav className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 lg:hidden">
        {primaryLinks.map((link) => (
          <button
            key={link.route}
            type="button"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-800"
            onClick={() => navigateTo(link.route)}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <aside className="fixed left-4 top-20 z-40 hidden w-60 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/95 p-4 shadow-xl backdrop-blur lg:block">
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">IQMS</p>
        <div className="space-y-2">
          {primaryLinks.map((link) => (
            <button
              key={link.route}
              type="button"
              className="w-full rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-left text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-elevated)]"
              onClick={() => navigateTo(link.route)}
            >
              {link.label}
            </button>
          ))}
          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-lg border border-amber-700 px-3 py-2 text-left text-sm text-amber-200 transition hover:bg-amber-900/20"
          >
            LeetCode
          </a>
        </div>
      </aside>
    </>
  );
}

export default SiteNav;
