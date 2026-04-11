import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import SectionHeader from "../components/ui/SectionHeader";
import SurfaceCard from "../components/ui/SurfaceCard";
import { famousDsaSheets } from "../data/famousSheets";
import { navigateTo, ROUTES } from "../services/routes";
import { calculateSheetProgress } from "../services/progress";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";

function HomePage({ theme, onThemeChange }) {
  const [copyingSheetId, setCopyingSheetId] = useState(null);
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const duplicateSheet = useSheetStore((state) => state.duplicateSheet);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  const recentSheets = useMemo(() => [...sheets]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 8), [sheets]);

  const copyFamousSheet = async (sheet) => {
    if (!currentUser?.token) {
      navigateTo(ROUTES.LOGIN);
      return;
    }

    setCopyingSheetId(sheet.id);
    try {
      const created = await duplicateSheet(currentUser.token, sheet, `${sheet.title} (Copy)`);
      if (created?.id) {
        navigateTo(`${ROUTES.APP}/${created.id}`);
      }
    } finally {
      setCopyingSheetId(null);
    }
  };

  return (
    <AppShell
      title="Home"
      subtitle="Your interview-prep workspace with curated sheets and quick resume actions"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Guest"}
    >
      <div className="space-y-5">
        <SurfaceCard elevated className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_8%,transparent),transparent_45%)]">
          <SectionHeader
            eyebrow="Dashboard"
            title="Welcome back"
            subtitle={currentUser?.token ? "Continue active practice sessions or copy a curated sheet." : "Log in to sync sheets, track progress, and manage your prep."}
          />
        </SurfaceCard>

        <SurfaceCard title="Recent Sheets" description="Quick access to your latest updated sheets.">
          {!currentUser?.token ? (
            <EmptyState
              title="Sign in to view recent sheets"
              description="Recent activity and progress are available after login."
              icon="🔐"
              action={<button className="btn-base btn-primary" type="button" onClick={() => navigateTo(ROUTES.LOGIN)}>Go to Login</button>}
            />
          ) : recentSheets.length === 0 ? (
            <EmptyState title="No recent sheets yet" description="Create or copy a sheet to start building your prep workflow." icon="📄" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recentSheets.map((sheet) => {
                const progress = calculateSheetProgress(sheet);
                return (
                  <button
                    key={sheet.id}
                    type="button"
                    className="surface-card surface-card-elevated text-left transition hover:-translate-y-0.5"
                    onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}
                  >
                    <p className="card-title line-clamp-1">{sheet.title || "Untitled Sheet"}</p>
                    <p className="meta-text mt-1">Updated {sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleString() : "Unknown"}</p>
                    <p className="meta-text mt-2">{progress.completedQuestions}/{progress.totalQuestions} solved · {progress.percent}%</p>
                    <div className="mt-2"><ProgressBar percent={progress.percent} /></div>
                  </button>
                );
              })}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="Famous Sheets" description="Curated sheet templates from app data.">
          <div className="grid gap-3 lg:grid-cols-2">
            {famousDsaSheets.map((sheet) => (
              <article key={sheet.id} className="surface-card surface-card-elevated">
                <h3 className="card-title">{sheet.title}</h3>
                <p className="meta-text mt-1">{sheet.description}</p>
                <button
                  type="button"
                  className="btn-base btn-neutral mt-3"
                  onClick={() => copyFamousSheet(sheet)}
                  disabled={copyingSheetId === sheet.id}
                >
                  {copyingSheetId === sheet.id ? "Copying..." : "Copy to My Sheets"}
                </button>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}

export default HomePage;
