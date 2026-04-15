import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";
import GoogleAuthButton from "../components/GoogleAuthButton";

function LoginPage({ theme, onThemeChange, onLoginSuccess, onGoToSignUp }) {
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const loginBlockedUntil = useAuthStore((state) => state.loginBlockedUntil);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [now, setNow] = useState(() => Date.now());
  const lockSeconds = Math.max(0, Math.ceil((loginBlockedUntil - now) / 1000));
  const isLocked = lockSeconds > 0;

  useEffect(() => {
    if (!isLocked) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isLocked]);

  const lockMessage = useMemo(() => {
    if (!isLocked) return "";
    const minutes = Math.ceil(lockSeconds / 60);
    return `Login temporarily disabled due to multiple wrong attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
  }, [isLocked, lockSeconds]);

  const submit = async (event) => {
    event.preventDefault();
    const success = await login(form);
    if (success) onLoginSuccess();
  };

  const handleGoogleLogin = async (idToken) => {
    const success = await loginWithGoogle(idToken);
    if (success) onLoginSuccess();
  };

  return (
    <AppShell title="Login" subtitle="Access your question sheets" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel mx-auto mt-6 w-full max-w-xl p-6">
        <form className="stack-form" onSubmit={submit}>
          <label>
            <span className="stack-form-label">Email or username</span>
            <input
              type="text"
              required
              disabled={authLoading || isLocked}
              value={form.identifier}
              placeholder="Enter your email or username"
              onChange={(event) => {
                clearAuthError();
                setForm((current) => ({ ...current, identifier: event.target.value }));
              }}
              className="field-base w-full"
            />
          </label>
          <label>
            <span className="stack-form-label">Password</span>
            <input
              type="password"
              required
              disabled={authLoading || isLocked}
              value={form.password}
              placeholder="Enter your password"
              onChange={(event) => {
                clearAuthError();
                setForm((current) => ({ ...current, password: event.target.value }));
              }}
              className="field-base w-full"
            />
          </label>
          {isLocked && <p className="text-sm text-[var(--accent-primary)]">{lockMessage}</p>}
          {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
          <button type="submit" disabled={authLoading || isLocked} className="btn-base btn-primary w-full">
            {isLocked ? `Try again in ${lockSeconds}s` : authLoading ? "Checking account..." : "Login"}
          </button>
        </form>

        <div className="my-4 text-center text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">or</div>
        <GoogleAuthButton
          disabled={authLoading || isLocked}
          text="signin_with"
          onCredential={handleGoogleLogin}
          onError={(message) => useAuthStore.setState({ authError: message })}
        />

        <button type="button" disabled={authLoading} onClick={onGoToSignUp} className="link-base mt-4 text-sm">
          Don&apos;t have an account? Sign up
        </button>
      </div>
    </AppShell>
  );
}

export default LoginPage;
