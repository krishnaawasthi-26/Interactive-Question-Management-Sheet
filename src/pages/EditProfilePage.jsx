import { useState } from "react";
import { navigateTo, ROUTES } from "../services/hashRouter";
import { useAuthStore } from "../store/authStore";
import SiteNav from "../components/SiteNav";

function EditProfilePage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [institution, setInstitution] = useState(currentUser?.institution || "");
  const [company, setCompany] = useState(currentUser?.company || "");
  const [websiteUrl, setWebsiteUrl] = useState(currentUser?.websiteUrl || "");
  const [githubUrl, setGithubUrl] = useState(currentUser?.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(currentUser?.linkedinUrl || "");

  return (
    <div className="app-shell text-[var(--text-primary)] transition-colors">
      <div className="app-content space-y-6 px-6 py-8">
        <SiteNav />
        <h1 className="text-2xl font-semibold">Edit Profile</h1>

        <div className="rounded-xl border border-gray-800 p-4 space-y-3 bg-[rgba(255,255,255,0.03)]">
          <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input
            className="w-full rounded border border-gray-700 bg-transparent px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="Unique username"
          />
          <textarea
            className="w-full rounded border border-gray-700 bg-transparent px-3 py-2"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Description / bio"
            rows={4}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Institution" />
            <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
          </div>
          <div className="space-y-3">
            <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Website link (optional)" />
            <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub profile link (optional)" />
            <input className="w-full rounded border border-gray-700 bg-transparent px-3 py-2" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn profile link (optional)" />
          </div>
          <div className="flex gap-2">
            <button
              className="rounded bg-emerald-600 px-3 py-2"
              onClick={async () => {
                const isSaved = await updateProfile({
                  name,
                  email,
                  username,
                  bio,
                  institution,
                  company,
                  websiteUrl,
                  githubUrl,
                  linkedinUrl,
                });
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
