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
    <nav className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
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
      <a
        href="https://leetcode.com"
        target="_blank"
        rel="noreferrer"
        className="rounded-md border border-amber-700 px-3 py-1.5 text-sm text-amber-200 transition hover:bg-amber-900/20"
      >
        LeetCode
      </a>
    </nav>
  );
}

export default SiteNav;
