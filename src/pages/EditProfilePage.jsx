import { useState } from "react";
import { navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";

function EditProfilePage({ theme, onThemeChange }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const authError = useAuthStore((state) => state.authError);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const requestEmailChangeOtp = useAuthStore((state) => state.requestEmailChangeOtp);
  const verifyEmailChangeOtp = useAuthStore((state) => state.verifyEmailChangeOtp);

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
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerificationId, setEmailVerificationId] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const usernameChangesRemaining = Number(currentUser?.usernameChangesRemaining ?? 7);
  const emailChangesRemaining = Number(currentUser?.emailChangesRemaining ?? 7);
  const isUsernameLocked = usernameChangesRemaining <= 0;
  const isEmailLocked = emailChangesRemaining <= 0;

  return (
    <AppShell title="Edit Profile" subtitle="Update public and personal details" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel space-y-3 p-5">
        <input className="field-base w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="field-base w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <p className={`text-xs ${isEmailLocked ? "text-[var(--accent-danger)]" : "text-[var(--text-secondary)]"}`}>
          Email (Gmail) changes left: {Math.max(0, emailChangesRemaining)} / 7
        </p>
        {email !== (currentUser?.email || "") && (
          <div className="rounded-lg border border-[var(--border-color)] p-3">
            {!emailVerificationId ? (
              <button
                className="btn-base btn-primary disabled:opacity-60"
                disabled={isEmailLocked}
                onClick={async () => {
                  const result = await requestEmailChangeOtp({ email });
                  if (result?.verificationId) {
                    setEmailVerificationId(result.verificationId);
                    setEmailStatus(result.message || "OTP sent to new email.");
                  }
                }}
              >
                Send email change OTP
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--text-secondary)]">{emailStatus}</p>
                <input className="field-base w-full" placeholder="Enter 6-digit OTP" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} />
                <button
                  className="btn-base btn-success"
                  onClick={async () => {
                    const verified = await verifyEmailChangeOtp({ verificationId: emailVerificationId, otp: emailOtp });
                    if (verified) {
                      setEmailVerificationId("");
                      setEmailOtp("");
                      setEmailStatus("Email updated successfully.");
                    }
                  }}
                >
                  Verify email OTP
                </button>
              </div>
            )}
          </div>
        )}
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
              const isSaved = await updateProfile({ name, username, bio, institution, company, websiteUrl, githubUrl, linkedinUrl, resumeUrl });
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
