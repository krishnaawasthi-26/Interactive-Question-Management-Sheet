import { useEffect } from "react";
import AppShell from "../components/AppShell";
import { navigateTo, ROUTES, slugifySegment } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";

function PublicSheetsPage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  const publicSheets = sheets.filter((sheet) => sheet.isPublic);
  const username = (currentUser?.username || "username").trim().toLowerCase();

  return (
    <AppShell
      title="Public Sheets"
      subtitle="All of your currently public sheets"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
    >
      <section className="panel rounded-xl p-4">
        {publicSheets.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">You do not have any public sheets yet.</p>
        ) : (
          <div className="space-y-2">
            {publicSheets.map((sheet) => (
              <div key={sheet.id} className="panel-elevated flex items-center justify-between rounded-lg p-3">
                <div>
                  <p className="font-medium">{sheet.title || "Untitled Sheet"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Public link: {`${window.location.origin}/profile/${username}/${slugifySegment(sheet.title || "Untitled Sheet")}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-base btn-neutral px-3 py-1"
                  onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

export default PublicSheetsPage;
