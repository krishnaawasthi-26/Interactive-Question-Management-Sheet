import { useEffect, useState } from "react";
import { navigateTo, ROUTES, slugifySegment } from "../services/hashRouter";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";
import { calculateOverallProgress, calculateSheetProgress } from "../services/progress";
import { famousDsaSheets } from "../data/famousSheets";

function ProfilePage({ onLogout }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const createNewSheet = useSheetStore((state) => state.createNewSheet);
  const deleteSheet = useSheetStore((state) => state.deleteSheet);
  const duplicateSheetById = useSheetStore((state) => state.duplicateSheetById);
  const duplicateSheet = useSheetStore((state) => state.duplicateSheet);

  const [newSheetTitle, setNewSheetTitle] = useState("");
  const [sheetTitles, setSheetTitles] = useState({});

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  const renameSheet = useSheetStore((state) => state.renameSheet);
  const persistedUsername = (currentUser?.username || "username").trim().toLowerCase();
  const profileShareUrl = `${window.location.origin}/profile/${persistedUsername}`;
  const overallProgress = calculateOverallProgress(sheets);

  return (
    <div className="min-h-screen [background-color:rgb(24_24_27/var(--tw-bg-opacity,1))] text-white">
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <button onClick={onLogout} className="rounded-md border border-rose-700 px-3 py-1 text-sm text-rose-200">Logout</button>
        </div>

        <div className="rounded-xl border border-gray-800 p-4 space-y-3 bg-[rgba(255,255,255,0.03)]">
          <h2 className="font-semibold">Profile details</h2>
          <p className="text-sm text-zinc-200">Name: {currentUser?.name || "-"}</p>
          <p className="text-sm text-zinc-200">Username: @{persistedUsername}</p>
          <p className="text-sm text-zinc-200">Total sheets: {sheets.length}</p>
          <button
            className="rounded bg-indigo-600 px-3 py-2"
            onClick={() => navigateTo(ROUTES.EDIT_PROFILE)}
          >
            Profile Info
          </button>
          <p className="text-xs text-zinc-400">Use Profile Info to add bio, institution/company, and links.</p>
          <p className="text-sm text-zinc-300 break-all">Share profile (read-only): {profileShareUrl}</p>
        </div>

        <div className="rounded-xl border border-gray-800 p-4 space-y-3 bg-[rgba(255,255,255,0.03)]">
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

        <div className="rounded-xl border border-gray-800 p-4 space-y-3 bg-[rgba(255,255,255,0.03)]">
          <h2 className="font-semibold">Create own sheets</h2>
          <div className="flex gap-2">
            <input className="flex-1 rounded border border-gray-700 bg-transparent px-3 py-2" placeholder="New sheet title" value={newSheetTitle} onChange={(e) => setNewSheetTitle(e.target.value)} />
            <button
              className="rounded bg-orange-600 px-3 py-2"
              onClick={async () => {
                const created = await createNewSheet(currentUser.token, newSheetTitle || "Untitled Sheet");
                setNewSheetTitle("");
                navigateTo(`${ROUTES.APP}/${created.id}`);
              }}
            >
              Create Sheet
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-800 p-4 space-y-3 bg-[rgba(255,255,255,0.03)]">
          <h2 className="font-semibold">Your sheets</h2>
          {sheets.length === 0 ? (
            <p className="text-sm text-zinc-400">No sheets created yet.</p>
          ) : (
            <div className="space-y-2">
              {sheets.map((sheet) => {
                const progress = calculateSheetProgress(sheet);
                return (
                  <div key={sheet.id} className="rounded border border-gray-700 p-3 flex items-center justify-between">
                    <div className="w-full max-w-md space-y-2">
                      <input
                        className="w-full rounded border border-gray-700 bg-transparent px-2 py-1 font-medium"
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
                      <p className="text-xs text-zinc-400 break-all">Share: {`${window.location.origin}/profile/${persistedUsername}/${slugifySegment(sheet.title || "Untitled Sheet")}`}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded border border-emerald-700 px-2 py-1"
                        onClick={async () => {
                          const nextTitle = ((sheetTitles[sheet.id] ?? sheet.title) || "").trim();
                          if (!nextTitle) return;
                          await renameSheet(currentUser.token, sheet.id, nextTitle);
                        }}
                      >
                        Save Name
                      </button>
                      <button className="rounded border border-sky-700 px-2 py-1" onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}>Open</button>
                      <button
                        className="rounded border border-amber-700 px-2 py-1"
                        onClick={async () => {
                          const copied = await duplicateSheetById(currentUser.token, sheet.id);
                          navigateTo(`${ROUTES.APP}/${copied.id}`);
                        }}
                      >
                        Copy
                      </button>
                      <button
                        className="rounded border border-red-700 px-2 py-1"
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

        <div className="rounded-xl border border-gray-800 p-4 space-y-3 bg-[rgba(255,255,255,0.03)]">
          <h2 className="font-semibold">Famous DSA sheets</h2>
          <p className="text-xs text-zinc-400">Sample templates with 1-2 starter questions each.</p>
          <div className="space-y-2">
            {famousDsaSheets.map((sheet) => (
              <div key={sheet.id} className="rounded border border-gray-700 p-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{sheet.title}</p>
                  <p className="text-xs text-zinc-400">{sheet.description}</p>
                </div>
                <button
                  className="rounded border border-orange-700 px-2 py-1 text-sm"
                  onClick={async () => {
                    const copied = await duplicateSheet(currentUser.token, sheet, sheet.title);
                    navigateTo(`${ROUTES.APP}/${copied.id}`);
                  }}
                >
                  Use this sheet
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
