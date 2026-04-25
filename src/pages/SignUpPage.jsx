import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";
import GoogleAuthButton from "../components/GoogleAuthButton";
import SeoMeta from "../components/SeoMeta";

function SignUpPage({ theme, onThemeChange, onSignUpSuccess, onGoToLogin }) {
  const signUp = useAuthStore((state) => state.signUp);
  const resendOtp = useAuthStore((state) => state.resendOtp);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const pendingSignupEmail = useAuthStore((state) => state.pendingSignupEmail);
  const otpResendAvailableInSeconds = useAuthStore((state) => state.otpResendAvailableInSeconds);
  const otpInfoMessage = useAuthStore((state) => state.otpInfoMessage);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);

  const [form, setForm] = useState({ name: "", email: "", username: "", password: "" });
  const [otp, setOtp] = useState("");
  const [resendLeft, setResendLeft] = useState(0);

  useEffect(() => {
    setResendLeft(Math.max(0, Number(otpResendAvailableInSeconds || 0)));
  }, [otpResendAvailableInSeconds]);

  useEffect(() => {
    if (resendLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendLeft]);

  const submitSignUp = async (event) => {
    event.preventDefault();
    const success = await signUp(form);
    if (success) {
      setOtp("");
    }
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    const success = await verifyOtp({ email: pendingSignupEmail, otp });
    if (success) onSignUpSuccess();
  };

  const handleGoogleSignup = async (idToken) => {
    const success = await loginWithGoogle(idToken);
    if (success) onSignUpSuccess();
  };

  const isOtpStep = Boolean(pendingSignupEmail);

  return (
    <AppShell title="Create account" subtitle="Start building your sheet workspace" theme={theme} onThemeChange={onThemeChange}>
      <SeoMeta
        title="Signup | Create DSA Sheets Online"
        description="Sign up on Create Sheets to build custom coding sheets, DSA practice trackers, and interview preparation lists."
        path="/signup"
        noIndex
        keywords={["signup create sheets", "create dsa sheet online"]}
      />
      <div className="panel mx-auto mt-6 w-full max-w-xl p-6">
        {!isOtpStep ? (
          <>
            <form className="stack-form" onSubmit={submitSignUp}>
              <label>
                <span className="stack-form-label">Full name</span>
                <input type="text" required disabled={authLoading} value={form.name} placeholder="Enter your full name" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, name: event.target.value })); }} className="field-base w-full" />
              </label>
              <label>
                <span className="stack-form-label">Email</span>
                <input type="email" required disabled={authLoading} value={form.email} placeholder="Enter your email" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, email: event.target.value })); }} className="field-base w-full" />
              </label>
              <label>
                <span className="stack-form-label">Username</span>
                <input type="text" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_-]+" disabled={authLoading} value={form.username} placeholder="Used in your shareable profile URL" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, username: event.target.value })); }} className="field-base w-full" />
              </label>
              <label>
                <span className="stack-form-label">Password</span>
                <input type="password" required minLength={8} disabled={authLoading} value={form.password} placeholder="Create a password" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, password: event.target.value })); }} className="field-base w-full" />
              </label>
              {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
              <button type="submit" disabled={authLoading} className="btn-base btn-primary w-full">{authLoading ? "Creating account..." : "Create account"}</button>
            </form>
            <div className="my-4 text-center text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">or</div>
            <GoogleAuthButton disabled={authLoading} text="signup_with" onCredential={handleGoogleSignup} onError={(message) => useAuthStore.setState({ authError: message })} />
          </>
        ) : (
          <form className="stack-form" onSubmit={submitOtp}>
            <p className="text-sm text-[var(--text-muted)]">Enter the 6-digit code sent to <span className="font-semibold text-[var(--text-primary)]">{pendingSignupEmail}</span>.</p>
            {otpInfoMessage && <p className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)]">{otpInfoMessage}</p>}
            <label>
              <span className="stack-form-label">Verification code</span>
              <input type="text" required pattern="\d{6}" minLength={6} maxLength={6} value={otp} disabled={authLoading} onChange={(event) => { clearAuthError(); setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); }} className="field-base w-full tracking-[0.4em] text-center" placeholder="000000" />
            </label>
            {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
            <button type="submit" disabled={authLoading || otp.length !== 6} className="btn-base btn-primary w-full">{authLoading ? "Verifying..." : "Verify & continue"}</button>
            <button type="button" disabled={authLoading || resendLeft > 0} className="btn-base btn-secondary w-full" onClick={() => resendOtp(pendingSignupEmail)}>
              {resendLeft > 0 ? `Resend OTP in ${resendLeft}s` : "Resend OTP"}
            </button>
          </form>
        )}

        <button type="button" disabled={authLoading} onClick={onGoToLogin} className="link-base mt-4 text-sm">Already have an account? Login</button>
      </div>
    </AppShell>
  );
}

export default SignUpPage;
