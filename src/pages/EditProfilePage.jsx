import { useState } from "react";
import { navigateTo, ROUTES } from "../services/hashRouter";
import { useAuthStore } from "../store/authStore";

function EditProfilePage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [username, setUsername] = useState(currentUser?.username || "");

  return (
    <div className="min-h-screen [background-color:rgb(24_24_27/var(--tw-bg-opacity,1))] text-white">
      <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Edit Profile</h1>

        <div className="rounded-xl border border-gray-800 p-4 space-y-3 bg-[rgba(255,255,255,0.03)]">
          <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="w-full rounded border border-gray-700 bg-transparent px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="Unique username"
          />
          <div className="flex gap-2">
            <button
              className="rounded bg-emerald-600 px-3 py-2"
              onClick={async () => {
                const isSaved = await updateProfile({ name, email, username });
                if (isSaved) {
                  navigateTo(ROUTES.PROFILE);
                }
              }}
            >
              Save Profile
            </button>
            <button className="rounded border border-gray-700 px-3 py-2" onClick={() => navigateTo(ROUTES.PROFILE)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfilePage;
