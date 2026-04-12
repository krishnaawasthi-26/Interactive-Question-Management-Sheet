import { useEffect, useMemo, useState } from "react";
import { fetchProfile } from "../api/profileApi";
import AppShell from "../components/AppShell";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import SectionHeader from "../components/ui/SectionHeader";
import StatCard from "../components/ui/StatCard";
import SurfaceCard from "../components/ui/SurfaceCard";
import { calculateOverallProgress, calculateSheetProgress } from "../services/progress";
import { navigateTo, ROUTES, slugifySegment } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";

function ProfilePage({ theme, onThemeChange, onLogout }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const createNewSheet = useSheetStore((state) => state.createNewSheet);
  const renameSheet = useSheetStore((state) => state.renameSheet);
  const deleteSheet = useSheetStore((state) => state.deleteSheet);
  const duplicateSheetById = useSheetStore((state) => state.duplicateSheetById);
  const setSheetVisibility = useSheetStore((state) => state.setSheetVisibility);
  const setSheetArchived = useSheetStore((state) => state.setSheetArchived);
  const limitWarning = useSheetStore((state) => state.limitWarning);
  const clearLimitWarning = useSheetStore((state) => state.clearLimitWarning);

  const [newSheetTitle, setNewSheetTitle] = useState("");
  const [createSheetError, setCreateSheetError] = useState("");
  const [sheetTitles, setSheetTitles] = useState({});
  const [engagementViewer, setEngagementViewer] = useState(null);
  const [profileDetails, setProfileDetails] = useState(currentUser || null);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.token) return;
      const profile = await fetchProfile(currentUser.token);
      setProfileDetails(profile);
    };
    loadProfile();
  }, [currentUser?.token]);

  const persistedUsername = (currentUser?.username || "username").trim().toLowerCase();
  const profileShareUrl = `${window.location.origin}/profile/${persistedUsername}`;
  const overallProgress = calculateOverallProgress(sheets);
  const ongoingSheets = sheets.filter((sheet) => !sheet.isArchived);
  const archivedSheets = sheets.filter((sheet) => sheet.isArchived);
  const publicSheets = sheets.filter((sheet) => sheet.isPublic);

  const totalDownloadCount = sheets.reduce((sum, sheet) => sum + (sheet.downloadedByUsernames?.length || 0), 0);
  const totalCopyCount = sheets.reduce((sum, sheet) => sum + (sheet.copiedByUsernames?.length || 0), 0);
  const allDownloadedUsers = sheets.flatMap((sheet) => (sheet.downloadedByUsernames || []).map((username) => ({ username, sheetTitle: sheet.title })));
  const allCopiedUsers = sheets.flatMap((sheet) => (sheet.copiedByUsernames || []).map((username) => ({ username, sheetTitle: sheet.title })));
  const followers = profileDetails?.followers || [];
  const following = profileDetails?.following || [];

  const normalizeUrl = (value) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const profileLinks = useMemo(() => [
    { label: "Website", href: normalizeUrl(profileDetails?.websiteUrl) },
    { label: "GitHub", href: normalizeUrl(profileDetails?.githubUrl) },
    { label: "LinkedIn", href: normalizeUrl(profileDetails?.linkedinUrl) },
    { label: "Resume", href: normalizeUrl(profileDetails?.resumeUrl) },
  ].filter((item) => item.href), [profileDetails]);

  const renderSheetRow = (sheet, options = { showManageActions: false }) => {
    const progress = calculateSheetProgress(sheet);
    return (
      <article key={sheet.id} className="surface-card surface-card-elevated">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <input
              className="w-full field-base font-medium"
              value={sheetTitles[sheet.id] ?? (sheet.title || "Untitled Sheet")}
              onChange={(event) => setSheetTitles((current) => ({ ...current, [sheet.id]: event.target.value }))}
            />
            <p className="meta-text">{progress.completedQuestions}/{progress.totalQuestions} solved · {progress.percent}% · {sheet.isPublic ? "Public" : "Private"}{sheet.isArchived ? " · Archived" : ""}</p>
            <ProgressBar percent={progress.percent} tone={progress.percent > 70 ? "success" : "warning"} />
            {sheet.isPublic ? (
              <p className="meta-text break-all">{`${window.location.origin}/profile/${persistedUsername}/${slugifySegment(sheet.title || "Untitled Sheet")}`}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-base btn-primary" type="button" onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}>Open</button>
            {options.showManageActions ? (
              <>
                <button
                  className="btn-base btn-success"
                  type="button"
                  onClick={async () => {
                    const nextTitle = ((sheetTitles[sheet.id] ?? sheet.title) || "").trim();
                    if (!nextTitle) return;
                    await renameSheet(currentUser.token, sheet.id, nextTitle);
                  }}
                >
                  Save Name
                </button>
                <button className="btn-base btn-neutral" type="button" onClick={() => setSheetVisibility(currentUser.token, sheet.id, !sheet.isPublic)}>{sheet.isPublic ? "Make Private" : "Make Public"}</button>
                <button className="btn-base btn-neutral" type="button" onClick={() => setSheetArchived(currentUser.token, sheet.id, !sheet.isArchived)}>{sheet.isArchived ? "Restore" : "Archive"}</button>
                <button
                  className="btn-base btn-neutral"
                  type="button"
                  onClick={async () => {
                    const copied = await duplicateSheetById(currentUser.token, sheet.id);
                    if (copied?.id) navigateTo(`${ROUTES.APP}/${copied.id}`);
                  }}
                >
                  Copy
                </button>
                <button
                  className="btn-base btn-danger"
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Are you sure to delete this sheet?")) return;
                    await deleteSheet(currentUser.token, sheet.id);
                  }}
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <AppShell
      title="My Profile"
      subtitle="Manage profile, sheet visibility, and overall preparation progress"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
      headerActions={<button onClick={onLogout} className="btn-base btn-danger text-sm">Logout</button>}
    >
      <div className="space-y-5">
        <SurfaceCard elevated>
          <SectionHeader eyebrow="Profile Summary" title={currentUser?.name || currentUser?.username || "Profile"} subtitle={`@${persistedUsername}`} actions={<button className="btn-base btn-primary" onClick={() => navigateTo(ROUTES.EDIT_PROFILE)}>Edit Profile Info</button>} />
          {profileDetails?.bio ? <p className="meta-text whitespace-pre-wrap">{profileDetails.bio}</p> : null}
          <p className="meta-text mt-2 break-all">Public profile link: {profileShareUrl}</p>
          {profileLinks.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{profileLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="btn-base btn-neutral text-xs">{link.label}</a>)}</div> : null}
        </SurfaceCard>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Sheets" value={sheets.length} />
          <StatCard label="Public" value={publicSheets.length} />
          <StatCard label="Archived" value={archivedSheets.length} />
          <StatCard label="Copied by You" value={profileDetails?.copiedSheetsCount ?? 0} />
        </div>

        <SurfaceCard title="Overall Progress" description="Private overview across all your sheets.">
          <p className="meta-text mb-2">{overallProgress.completedQuestions}/{overallProgress.totalQuestions} solved ({overallProgress.percent}%)</p>
          <ProgressBar percent={overallProgress.percent} />
        </SurfaceCard>

        <SurfaceCard title="Community & Engagement" description="Followers, following, downloads, and copies.">
          <div className="flex flex-wrap gap-2">
            <button className="btn-base btn-success" type="button" onClick={() => setEngagementViewer({ title: "Downloaded by", users: allDownloadedUsers })}>Downloaded: {totalDownloadCount}</button>
            <button className="btn-base btn-neutral" type="button" onClick={() => setEngagementViewer({ title: "Followers", users: followers.map((entry) => ({ ...entry, sheetTitle: "" })) })}>Followers: {profileDetails?.followersCount ?? followers.length}</button>
            <button className="btn-base btn-neutral" type="button" onClick={() => setEngagementViewer({ title: "Following", users: following.map((entry) => ({ ...entry, sheetTitle: "" })) })}>Following: {profileDetails?.followingCount ?? following.length}</button>
            <button className="btn-base btn-neutral" type="button" onClick={() => setEngagementViewer({ title: "Copied by", users: allCopiedUsers })}>Copied: {totalCopyCount}</button>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Create New Sheet" description="Start a new tracking sheet with dynamic title support.">
          {createSheetError ? <div className="rounded-md border border-rose-600/60 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{createSheetError}</div> : null}
          {limitWarning ? <div className="mb-3 flex items-center justify-between rounded-md border border-amber-600/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"><span>{limitWarning}</span><button type="button" className="btn-base btn-neutral px-2 py-1 text-xs" onClick={clearLimitWarning}>Dismiss</button></div> : null}
          <div className="flex flex-wrap gap-2">
            <input className="field-base min-w-[280px] flex-1" placeholder="New sheet title" value={newSheetTitle} onChange={(e) => { setNewSheetTitle(e.target.value); if (createSheetError) setCreateSheetError(""); }} />
            <button
              className="btn-base btn-primary"
              onClick={async () => {
                const trimmedTitle = newSheetTitle.trim() || "Untitled Sheet";
                if (!currentUser?.token) {
                  setCreateSheetError("Your login session is missing. Please login again, then create a sheet.");
                  navigateTo(ROUTES.LOGIN);
                  return;
                }

                setCreateSheetError("");
                try {
                  const created = await createNewSheet(currentUser.token, trimmedTitle);
                  if (!created?.id) return;
                  setNewSheetTitle("");
                  navigateTo(`${ROUTES.APP}/${created.id}`);
                } catch (error) {
                  setCreateSheetError(error?.message || "Unable to create sheet right now. Please try again.");
                }
              }}
            >Create Sheet</button>
          </div>
        </SurfaceCard>

        <SurfaceCard title="On-going Sheets" description="Active sheets with full action controls.">
          {ongoingSheets.length === 0 ? <EmptyState title="No active sheets" description="Create a sheet to begin interview tracking." icon="🗂️" /> : <div className="space-y-3">{ongoingSheets.map((sheet) => renderSheetRow(sheet, { showManageActions: true }))}</div>}
        </SurfaceCard>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard title="Public Sheets" description="Visible on your public profile URL.">
            {publicSheets.length === 0 ? <EmptyState title="No public sheets" description="Change visibility on a sheet to publish it." icon="🌐" /> : <div className="space-y-3">{publicSheets.map((sheet) => renderSheetRow(sheet))}</div>}
          </SurfaceCard>
          <SurfaceCard title="Archived Sheets" description="Archived sheets can be restored at any time.">
            {archivedSheets.length === 0 ? <EmptyState title="No archived sheets" description="Archived sheets will appear here for quick restore." icon="🗃️" /> : <div className="space-y-3">{archivedSheets.map((sheet) => renderSheetRow(sheet))}</div>}
          </SurfaceCard>
        </div>

        <SurfaceCard title="Recently Updated Sheets" description="Most recent updates in your workspace.">
          {sheets.length === 0 ? (
            <EmptyState title="No updates yet" description="Create your first sheet to start tracking preparation progress." icon="⏱️" />
          ) : (
            <div className="space-y-2">
              {[...sheets].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 5).map((sheet) => (
                <div key={sheet.id} className="surface-card surface-card-elevated flex items-center justify-between gap-4">
                  <div>
                    <p className="card-title">{sheet.title || "Untitled Sheet"}</p>
                    <p className="meta-text">{calculateSheetProgress(sheet).completedQuestions}/{calculateSheetProgress(sheet).totalQuestions} solved</p>
                  </div>
                  <button className="btn-base btn-neutral" onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}>Open</button>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        {engagementViewer ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="panel w-full max-w-lg p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="section-title">{engagementViewer.title}</h3>
                <button type="button" className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => setEngagementViewer(null)}>Close</button>
              </div>
              {engagementViewer.users.length === 0 ? (
                <p className="meta-text">No users yet.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-auto">
                  {engagementViewer.users.map((entry, index) => (
                    <div key={`${entry.username}-${entry.sheetTitle}-${index}`} className="surface-card surface-card-elevated p-3 text-sm">
                      <p className="card-title">@{entry.username}</p>
                      <p className="meta-text">{entry.sheetTitle ? `Sheet: ${entry.sheetTitle || "Untitled Sheet"}` : (entry.name || "Create Sheets user")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

export default ProfilePage;
