import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";

function SignUpPage({ theme, onThemeChange, onSignUpSuccess, onGoToLogin }) {
  const requestSignUpOtp = useAuthStore((state) => state.requestSignUpOtp);
  const verifySignUpOtp = useAuthStore((state) => state.verifySignUpOtp);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "" });
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const requestOtp = async (event) => {
    event.preventDefault();
    const result = await requestSignUpOtp(form);
    if (result?.verificationId) {
      setVerificationId(result.verificationId);
      setStatusMessage(result.message || "OTP sent to your email.");
    }
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    const success = await verifySignUpOtp({ verificationId, otp });
    if (success) onSignUpSuccess();
  };

  return (
    <AppShell title="Create account" subtitle="Start building your sheet workspace" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel mx-auto mt-6 w-full max-w-xl p-6">
        {!verificationId ? (
          <form className="space-y-3" onSubmit={requestOtp}>
            <input type="text" required disabled={authLoading} value={form.name} placeholder="Full name" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, name: event.target.value })); }} className="field-base w-full" />
            <input type="email" required disabled={authLoading} value={form.email} placeholder="Email" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, email: event.target.value })); }} className="field-base w-full" />
            <input type="text" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_-]+" disabled={authLoading} value={form.username} placeholder="Unique name (used in shareable URL)" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, username: event.target.value })); }} className="field-base w-full" />
            <input type="password" required minLength={6} disabled={authLoading} value={form.password} placeholder="Password" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, password: event.target.value })); }} className="field-base w-full" />
            {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
            <button type="submit" disabled={authLoading} className="btn-base btn-primary w-full disabled:opacity-60">{authLoading ? "Sending OTP..." : "Send OTP"}</button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={submitOtp}>
            <p className="text-sm text-[var(--text-secondary)]">{statusMessage || "Enter the OTP sent to your email to complete signup."}</p>
            <input type="text" required maxLength={6} pattern="[0-9]{6}" value={otp} disabled={authLoading} placeholder="6-digit OTP" onChange={(event) => { clearAuthError(); setOtp(event.target.value); }} className="field-base w-full" />
            {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
            <button type="submit" disabled={authLoading} className="btn-base btn-primary w-full disabled:opacity-60">{authLoading ? "Verifying OTP..." : "Verify & Create account"}</button>
          </form>
        )}
        <button type="button" disabled={authLoading} onClick={onGoToLogin} className="mt-4 text-sm text-[var(--accent-info)]">Already have an account? Login</button>
      </div>
    </AppShell>
  );
}

export default SignUpPage;
