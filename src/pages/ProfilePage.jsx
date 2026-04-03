import { useEffect, useState } from "react";
import { navigateTo, ROUTES } from "../services/hashRouter";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";

function ProfilePage({ onLogout }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const createNewSheet = useSheetStore((state) => state.createNewSheet);
  const deleteSheet = useSheetStore((state) => state.deleteSheet);

  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [newSheetTitle, setNewSheetTitle] = useState("");

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  const profileShareUrl = `${window.location.origin}${window.location.pathname}#/shared/profile/${currentUser?.profileShareId}`;

  return (
    <div className="min-h-screen [background-color:rgb(24_24_27/var(--tw-bg-opacity,1))] text-white">
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <button onClick={onLogout} className="rounded-md border border-rose-700 px-3 py-1 text-sm text-rose-200">Logout</button>
        </div>

        <div className="rounded-xl border border-gray-800 p-4 space-y-3 bg-[rgba(255,255,255,0.03)]">
          <h2 className="font-semibold">Edit profile</h2>
          <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button
            className="rounded bg-emerald-600 px-3 py-2"
            onClick={() => updateProfile({ name, email })}
          >
            Save Profile
          </button>
          <p className="text-sm text-zinc-300 break-all">Share profile (read-only): {profileShareUrl}</p>
        </div>

        <div className="rounded-xl border border-gray-800 p-4 space-y-3 bg-[rgba(255,255,255,0.03)]">
          <h2 className="font-semibold">My sheets</h2>
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

          <div className="space-y-2">
            {sheets.map((sheet) => (
              <div key={sheet.id} className="rounded border border-gray-700 p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{sheet.title}</p>
                  <p className="text-xs text-zinc-400 break-all">Share: {`${window.location.origin}${window.location.pathname}#/shared/sheet/${sheet.shareId}`}</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded border border-sky-700 px-2 py-1" onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}>Open</button>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
