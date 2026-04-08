import { useState } from "react";
import { navigateTo, ROUTES } from "../services/hashRouter";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";

function EditProfilePage({ theme, onThemeChange }) {
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
    <AppShell title="Edit Profile" subtitle="Update public and personal details" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel space-y-3 p-5">
        <input className="field-base w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="field-base w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="field-base w-full" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="Unique username" />
        <textarea className="field-base w-full" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Description / bio" rows={4} />
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field-base w-full" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Institution" />
          <input className="field-base w-full" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
        </div>
        <input className="field-base w-full" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Website link (optional)" />
        <input className="field-base w-full" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub profile link (optional)" />
        <input className="field-base w-full" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn profile link (optional)" />
        <div className="flex gap-2">
          <button
            className="btn-base btn-success"
            onClick={async () => {
              const isSaved = await updateProfile({ name, email, username, bio, institution, company, websiteUrl, githubUrl, linkedinUrl });
              if (isSaved) navigateTo(ROUTES.PROFILE);
            }}
          >
            Save Profile
          </button>
          <button className="btn-base btn-neutral" onClick={() => navigateTo(ROUTES.PROFILE)}>Cancel</button>
        </div>
      </div>
    </AppShell>
  );
}

export default EditProfilePage;
