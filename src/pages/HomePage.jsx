import { useEffect } from "react";
import AppShell from "../components/AppShell";
import { famousDsaSheets } from "../data/famousSheets";
import { navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";

function HomePage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  const recentSheets = [...sheets]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 6);

  return (
    <AppShell
      title="Home"
      subtitle="Browse famous sheets and quickly continue your recent work"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel rounded-xl p-4">
          <h2 className="mb-3 text-lg font-semibold">Famous Sheets</h2>
          <div className="space-y-3">
            {famousDsaSheets.map((sheet) => (
              <article key={sheet.id} className="panel-elevated rounded-lg p-3">
                <h3 className="font-medium text-[var(--text-primary)]">{sheet.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{sheet.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel rounded-xl p-4">
          <h2 className="mb-3 text-lg font-semibold">Recent Sheets</h2>
          {recentSheets.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No recent sheets yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSheets.map((sheet) => (
                <button
                  key={sheet.id}
                  type="button"
                  className="panel-elevated w-full rounded-lg px-3 py-2 text-left hover:opacity-90"
                  onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}
                >
                  <p className="font-medium">{sheet.title || "Untitled Sheet"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Updated: {sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleString() : "Unknown"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default HomePage;
