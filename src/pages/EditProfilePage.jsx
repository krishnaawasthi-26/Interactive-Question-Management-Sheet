import { useState } from "react";
import { getUserProfileRoute, navigateTo } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";

function EditProfilePage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const authError = useAuthStore((state) => state.authError);
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
  const [resumeUrl, setResumeUrl] = useState(currentUser?.resumeUrl || "");
  const usernameChangesRemaining = Number(currentUser?.usernameChangesRemaining ?? 7);
  const emailChangesRemaining = Number(currentUser?.emailChangesRemaining ?? 7);
  const isUsernameLocked = usernameChangesRemaining <= 0;
  const isEmailLocked = emailChangesRemaining <= 0;

  return (
    <AppShell title="Edit Profile" subtitle="Update public and personal details" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel space-y-3 p-5">
        <input className="field-base w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="field-base w-full disabled:opacity-60" value={email} disabled={isEmailLocked} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <p className={`text-xs ${isEmailLocked ? "text-[var(--accent-danger)]" : "text-[var(--text-secondary)]"}`}>
          Email (Gmail) changes left: {Math.max(0, emailChangesRemaining)} / 7
        </p>
        <input
          className="field-base w-full disabled:opacity-60"
          value={username}
          disabled={isUsernameLocked}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="Unique username"
        />
        <p className={`text-xs ${isUsernameLocked ? "text-[var(--accent-danger)]" : "text-[var(--text-secondary)]"}`}>
          Username changes left: {Math.max(0, usernameChangesRemaining)} / 7
        </p>
        <textarea className="field-base w-full" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Description / bio" rows={4} />
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field-base w-full" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Institution" />
          <input className="field-base w-full" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
        </div>
        <input className="field-base w-full" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Website link (optional)" />
        <input className="field-base w-full" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="GitHub profile link (optional)" />
        <input className="field-base w-full" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn profile link (optional)" />
        <input className="field-base w-full" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="Resume link (optional)" />
        {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
        <div className="flex gap-2">
          <button
            className="btn-base btn-success"
            onClick={async () => {
              const isSaved = await updateProfile({ name, email, username, bio, institution, company, websiteUrl, githubUrl, linkedinUrl, resumeUrl });
              if (isSaved) navigateTo(getUserProfileRoute(username));
            }}
          >
            Save Profile
          </button>
          <button className="btn-base btn-neutral" onClick={() => navigateTo(getUserProfileRoute(currentUser?.username))}>Cancel</button>
        </div>
      </div>
    </AppShell>
  );
}

export default EditProfilePage;
