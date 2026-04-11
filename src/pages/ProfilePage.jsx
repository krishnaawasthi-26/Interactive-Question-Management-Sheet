import { useEffect, useState } from "react";
import { navigateTo, ROUTES, slugifySegment } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";
import { calculateOverallProgress, calculateSheetProgress } from "../services/progress";
import { fetchProfile } from "../api/profileApi";
import AppShell from "../components/AppShell";

function ProfilePage({ theme, onThemeChange, onLogout }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const createNewSheet = useSheetStore((state) => state.createNewSheet);
  const deleteSheet = useSheetStore((state) => state.deleteSheet);
  const duplicateSheetById = useSheetStore((state) => state.duplicateSheetById);
  const setSheetVisibility = useSheetStore((state) => state.setSheetVisibility);
  const setSheetArchived = useSheetStore((state) => state.setSheetArchived);
  const limitWarning = useSheetStore((state) => state.limitWarning);
  const clearLimitWarning = useSheetStore((state) => state.clearLimitWarning);

  const [newSheetTitle, setNewSheetTitle] = useState("");
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

  const renameSheet = useSheetStore((state) => state.renameSheet);
  const persistedUsername = (currentUser?.username || "username").trim().toLowerCase();
  const profileShareUrl = `${window.location.origin}/profile/${persistedUsername}`;
  const overallProgress = calculateOverallProgress(sheets);
  const ongoingSheets = sheets.filter((sheet) => !sheet.isArchived);
  const archivedSheets = sheets.filter((sheet) => sheet.isArchived);
  const publicSheets = sheets.filter((sheet) => sheet.isPublic);
  const totalDownloadCount = sheets.reduce(
    (sum, sheet) => sum + (sheet.downloadedByUsernames?.length || 0),
    0
  );
  const totalCopyCount = sheets.reduce((sum, sheet) => sum + (sheet.copiedByUsernames?.length || 0), 0);
  const allDownloadedUsers = sheets.flatMap((sheet) =>
    (sheet.downloadedByUsernames || []).map((username) => ({ username, sheetTitle: sheet.title }))
  );
  const allCopiedUsers = sheets.flatMap((sheet) =>
    (sheet.copiedByUsernames || []).map((username) => ({ username, sheetTitle: sheet.title }))
  );
  const followers = profileDetails?.followers || [];
  const following = profileDetails?.following || [];

  const normalizeUrl = (value) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const profileLinks = [
    { label: "Website", href: normalizeUrl(profileDetails?.websiteUrl) },
    { label: "GitHub", href: normalizeUrl(profileDetails?.githubUrl) },
    { label: "LinkedIn", href: normalizeUrl(profileDetails?.linkedinUrl) },
    { label: "Resume", href: normalizeUrl(profileDetails?.resumeUrl) },
  ].filter((item) => item.href);

  return (
    <AppShell
      title="My Profile"
      subtitle="Manage sheets, progress, and profile visibility"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Account"}
      headerActions={<button onClick={onLogout} className="btn-base btn-danger text-sm">Logout</button>}
    >
      <div className="space-y-6">

        <div className="panel rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Profile details</h2>
          <p className="text-sm text-zinc-200">Name: {currentUser?.name || "-"}</p>
          <p className="text-sm text-zinc-200">Username: @{persistedUsername}</p>
          <p className="text-sm text-zinc-200">Total sheets: {sheets.length}</p>
          <p className="text-sm text-zinc-200">Public sheets: {publicSheets.length}</p>
          <p className="text-sm text-zinc-200">Archived sheets: {archivedSheets.length}</p>
          <p className="text-sm text-zinc-200">Sheets copied by you: {profileDetails?.copiedSheetsCount ?? 0}</p>
          {profileDetails?.bio && <p className="text-sm text-zinc-200 whitespace-pre-wrap">Description: {profileDetails.bio}</p>}
          {(profileDetails?.institution || profileDetails?.company) && (
            <p className="text-sm text-zinc-200">
              {profileDetails?.institution && <span>Institution: {profileDetails.institution}</span>}
              {profileDetails?.institution && profileDetails?.company && <span> · </span>}
              {profileDetails?.company && <span>Company: {profileDetails.company}</span>}
            </p>
          )}
          {profileLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 text-sm text-zinc-200">
              <span>Links:</span>
              {profileLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-300 underline underline-offset-2"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              className="btn-base btn-success px-2 py-1 text-emerald-200"
              type="button"
              onClick={() =>
                setEngagementViewer({ title: "Downloaded by", users: allDownloadedUsers })
              }
            >
              Downloaded: {totalDownloadCount}
            </button>
            <button
              className="btn-base btn-neutral px-2 py-1 text-sky-200"
              type="button"
              onClick={() =>
                setEngagementViewer({ title: "Followers", users: followers.map((entry) => ({ ...entry, sheetTitle: "" })) })
              }
            >
              Followers: {profileDetails?.followersCount ?? followers.length}
            </button>
            <button
              className="btn-base btn-neutral px-2 py-1 text-fuchsia-200"
              type="button"
              onClick={() =>
                setEngagementViewer({ title: "Following", users: following.map((entry) => ({ ...entry, sheetTitle: "" })) })
              }
            >
              Following: {profileDetails?.followingCount ?? following.length}
            </button>
            <button
              className="btn-base btn-neutral px-2 py-1 text-amber-200"
              type="button"
              onClick={() => setEngagementViewer({ title: "Copied by", users: allCopiedUsers })}
            >
              Copied: {totalCopyCount}
            </button>
          </div>
          <button
            className="btn-base btn-primary"
            onClick={() => navigateTo(ROUTES.EDIT_PROFILE)}
          >
            Profile Info
          </button>
          <p className="text-xs text-zinc-400">Use Profile Info to add bio, institution/company, resume, and links.</p>
          <p className="text-sm text-zinc-300 break-all">Share profile (read-only): {profileShareUrl}</p>
        </div>

        <div className="panel rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">My overall progress</h2>
          <p className="text-sm text-zinc-200">
            {overallProgress.completedQuestions}/{overallProgress.totalQuestions} solved ({overallProgress.percent}%)
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-700">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${overallProgress.percent}%` }} />
          </div>
          <p className="text-xs text-zinc-400">
            This progress is private and visible only on your own profile page.
          </p>
        </div>

        <div className="panel rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Create own sheets</h2>
          {limitWarning && (
            <div className="flex items-center justify-between rounded-md border border-amber-600/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <span>{limitWarning}</span>
              <button type="button" className="rounded border border-amber-500 px-2 py-0.5 text-xs" onClick={clearLimitWarning}>
                Dismiss
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input className="flex-1 field-base" placeholder="New sheet title" value={newSheetTitle} onChange={(e) => setNewSheetTitle(e.target.value)} />
            <button
              className="btn-base btn-primary"
              onClick={async () => {
                const created = await createNewSheet(currentUser.token, newSheetTitle || "Untitled Sheet");
                if (!created) return;
                setNewSheetTitle("");
                navigateTo(`${ROUTES.APP}/${created.id}`);
              }}
            >
              Create Sheet
            </button>
          </div>
        </div>

        <div className="panel rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">On-going sheets</h2>
          <p className="text-xs text-zinc-400">These are active sheets and are easiest to access from the main profile page.</p>
          {ongoingSheets.length === 0 ? (
            <p className="text-sm text-zinc-400">No sheets created yet.</p>
          ) : (
            <div className="space-y-2">
              {ongoingSheets.map((sheet) => {
                const progress = calculateSheetProgress(sheet);
                return (
                  <div key={sheet.id} className="panel-elevated rounded-lg p-3 flex items-center justify-between">
                    <div className="w-full max-w-md space-y-2">
                      <input
                        className="w-full field-base px-2 py-1 font-medium"
                        value={sheetTitles[sheet.id] ?? (sheet.title || "Untitled Sheet")}
                        onChange={(event) => setSheetTitles((current) => ({ ...current, [sheet.id]: event.target.value }))}
                      />
                      <p className="text-xs text-zinc-300">
                        Progress: {progress.completedQuestions}/{progress.totalQuestions} ({progress.percent}%)
                      </p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      {sheet.isPublic ? (
                        <p className="text-xs text-zinc-400 break-all">
                          Share: {`${window.location.origin}/profile/${persistedUsername}/${slugifySegment(sheet.title || "Untitled Sheet")}`}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500">Share link is hidden while this sheet is private.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-base btn-success px-2 py-1"
                        onClick={async () => {
                          const nextTitle = ((sheetTitles[sheet.id] ?? sheet.title) || "").trim();
                          if (!nextTitle) return;
                          await renameSheet(currentUser.token, sheet.id, nextTitle);
                        }}
                      >
                        Save Name
                      </button>
                      <button className="btn-base btn-neutral px-2 py-1" onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}>Open</button>
                      <button
                        className="btn-base btn-neutral px-2 py-1"
                        onClick={() => setSheetVisibility(currentUser.token, sheet.id, !sheet.isPublic)}
                      >
                        {sheet.isPublic ? "Make Private" : "Make Public"}
                      </button>
                      <button
                        className="btn-base btn-neutral px-2 py-1"
                        onClick={() => setSheetArchived(currentUser.token, sheet.id, true)}
                      >
                        Archive
                      </button>
                      <button
                        className="btn-base btn-neutral px-2 py-1"
                        onClick={async () => {
                          const copied = await duplicateSheetById(currentUser.token, sheet.id);
                          if (!copied) return;
                          navigateTo(`${ROUTES.APP}/${copied.id}`);
                        }}
                      >
                        Copy
                      </button>
                      <button
                        className="btn-base btn-danger px-2 py-1"
                        onClick={async () => {
                          if (!window.confirm("Are you sure to delete this sheet?")) return;
                          await deleteSheet(currentUser.token, sheet.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="panel rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Public sheets</h2>
          <p className="text-xs text-zinc-400">Only these sheets are visible on your public profile URL.</p>
          {publicSheets.length === 0 ? (
            <p className="text-sm text-zinc-400">No public sheets yet.</p>
          ) : (
            <div className="space-y-2">
              {publicSheets.map((sheet) => (
                <div key={sheet.id} className="panel-elevated rounded-lg p-3 flex items-center justify-between">
                  <p className="font-medium">{sheet.title}</p>
                  <a
                    className="text-xs text-zinc-300 underline-offset-2 hover:underline"
                    href={`/profile/${persistedUsername}/${slugifySegment(sheet.title || "Untitled Sheet")}`}
                  >
                    Open public URL
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Archived sheets</h2>
          <p className="text-xs text-zinc-400">Archived sheets are moved out of your main workflow, but still easy to restore.</p>
          {archivedSheets.length === 0 ? (
            <p className="text-sm text-zinc-400">No archived sheets yet.</p>
          ) : (
            <div className="space-y-2">
              {archivedSheets.map((sheet) => (
                <div key={sheet.id} className="panel-elevated rounded-lg p-3 flex items-center justify-between">
                  <p className="font-medium">{sheet.title}</p>
                  <div className="flex gap-2">
                    <button
                      className="btn-base btn-neutral px-2 py-1"
                      onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}
                    >
                      Open
                    </button>
                    <button
                      className="btn-base btn-neutral px-2 py-1"
                      onClick={() => setSheetArchived(currentUser.token, sheet.id, false)}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">Recently updated sheets</h2>
          <p className="text-xs text-zinc-400">Only your own sheets appear here. No static templates are shown.</p>
          {sheets.length === 0 ? (
            <p className="text-sm text-zinc-400">Create your first sheet to start tracking your preparation.</p>
          ) : (
            <div className="space-y-2">
              {[...sheets]
                .slice()
                .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
                .slice(0, 5)
                .map((sheet) => (
                  <div key={sheet.id} className="panel-elevated rounded-lg p-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{sheet.title || "Untitled Sheet"}</p>
                      <p className="text-xs text-zinc-400">
                        Questions: {calculateSheetProgress(sheet).completedQuestions}/{calculateSheetProgress(sheet).totalQuestions}
                      </p>
                    </div>
                    <button
                      className="btn-base btn-neutral px-2 py-1 text-sm"
                      onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}
                    >
                      Open
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      {engagementViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="panel w-full max-w-lg p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{engagementViewer.title}</h3>
              <button
                type="button"
                className="btn-base btn-neutral px-2 py-1 text-xs"
                onClick={() => setEngagementViewer(null)}
              >
                Close
              </button>
            </div>
            {engagementViewer.users.length === 0 ? (
              <p className="text-sm text-zinc-400">No users yet.</p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto">
                {engagementViewer.users.map((entry, index) => (
                  <div key={`${entry.username}-${entry.sheetTitle}-${index}`} className="panel-elevated rounded-lg p-2 text-sm">
                    <p className="font-medium">@{entry.username}</p>
                    {entry.sheetTitle ? (
                      <p className="text-xs text-zinc-400">Sheet: {entry.sheetTitle || "Untitled Sheet"}</p>
                    ) : (
                      <p className="text-xs text-zinc-400">{entry.name ? entry.name : "IQMS user"}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}

export default ProfilePage;
