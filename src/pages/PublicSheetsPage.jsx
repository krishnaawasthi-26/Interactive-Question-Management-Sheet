import { useEffect } from "react";
import AppShell from "../components/AppShell";
import EmptyState from "../components/ui/EmptyState";
import SurfaceCard from "../components/ui/SurfaceCard";
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
      subtitle="Manage and preview sheets visible on your public profile"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
    >
      <SurfaceCard title="Published Sheets" description="These sheets can be viewed by others using your profile URL.">
        {publicSheets.length === 0 ? (
          <EmptyState title="No public sheets yet" description="Set a sheet to public from My Sheets or Profile to publish it." icon="🌍" />
        ) : (
          <div className="space-y-3">
            {publicSheets.map((sheet) => (
              <article key={sheet.id} className="surface-card surface-card-elevated flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="card-title truncate">{sheet.title || "Untitled Sheet"}</p>
                  <p className="meta-text break-all">{`${window.location.origin}/profile/${username}/${slugifySegment(sheet.title || "Untitled Sheet")}`}</p>
                </div>
                <button type="button" className="btn-base btn-neutral" onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}>Open</button>
              </article>
            ))}
          </div>
        )}
      </SurfaceCard>
    </AppShell>
  );
}

export default PublicSheetsPage;
