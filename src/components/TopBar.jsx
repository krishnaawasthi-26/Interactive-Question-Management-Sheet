import { Link } from "react-router-dom";
import { getUserProfileRoute } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import ThemeCinematicToggle from "./theme/ThemeCinematicToggle";

function TopBar({ userLabel = "Account", actions }) {
  const currentUsername = useAuthStore((state) => state.currentUser?.username);

  return (
    <header className="panel-elevated theme-topbar mb-4 px-4 py-3 sm:px-5">
      <div className="theme-topbar__accent" aria-hidden="true" />
      <div className="flex flex-wrap items-center justify-between gap-3 md:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_16%,transparent),var(--surface))] text-sm">📘</div>
          <div className="min-w-0">
            <p className="eyebrow">Create Sheets Workspace</p>
            <p className="truncate text-sm text-[var(--text-secondary)]">Focused interview-prep operating system</p>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-nowrap items-center justify-end gap-2 md:w-auto md:flex-none">
          <div className="flex flex-none items-center gap-2">
            {actions}
          </div>
          <div className="flex-none">
            <ThemeCinematicToggle />
          </div>
          <Link to={getUserProfileRoute(currentUsername)} className="btn-base btn-neutral min-w-0 max-w-[clamp(8rem,20vw,13rem)] truncate px-3 py-1.5 text-sm font-medium">
            {userLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
