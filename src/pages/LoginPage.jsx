import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function LoginPage({ theme, onThemeChange, onLoginSuccess, onGoToSignUp }) {
  const login = useAuthStore((state) => state.login);
  const googleLogin = useAuthStore((state) => state.loginWithGoogle);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const loginBlockedUntil = useAuthStore((state) => state.loginBlockedUntil);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [now, setNow] = useState(() => Date.now());
  const lockSeconds = Math.max(0, Math.ceil((loginBlockedUntil - now) / 1000));
  const isLocked = lockSeconds > 0;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) return undefined;

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {};
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        const success = await googleLogin({ idToken: credential });
        if (success) onLoginSuccess();
      },
    });

    const mount = document.getElementById("google-login-button");
    if (mount) {
      mount.innerHTML = "";
      window.google.accounts.id.renderButton(mount, { theme: "outline", size: "large", width: 320 });
    }
  }, [googleLogin, onLoginSuccess]);

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

  return (
    <AppShell title="Login" subtitle="Access your question sheets" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel mx-auto mt-6 w-full max-w-xl p-6">
        <form className="space-y-3" onSubmit={submit}>
          <input
            type="text"
            required
            disabled={authLoading || isLocked}
            value={form.identifier}
            placeholder="Email or username"
            onChange={(event) => {
              clearAuthError();
              setForm((current) => ({ ...current, identifier: event.target.value }));
            }}
            className="field-base w-full"
          />
          <input
            type="password"
            required
            disabled={authLoading || isLocked}
            value={form.password}
            placeholder="Password"
            onChange={(event) => {
              clearAuthError();
              setForm((current) => ({ ...current, password: event.target.value }));
            }}
            className="field-base w-full"
          />
          {isLocked && <p className="text-sm text-[var(--accent-primary)]">{lockMessage}</p>}
          {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
          <button type="submit" disabled={authLoading || isLocked} className="btn-base btn-primary w-full disabled:opacity-60">
            {isLocked ? `Try again in ${lockSeconds}s` : authLoading ? "Checking account..." : "Login"}
          </button>
        </form>
        {GOOGLE_CLIENT_ID && <div className="mt-4 flex justify-center" id="google-login-button" />}
        <button type="button" disabled={authLoading} onClick={onGoToSignUp} className="mt-4 text-sm text-[var(--accent-info)]">
          Don&apos;t have an account? Sign up
        </button>
      </div>
    </AppShell>
  );
}

export default LoginPage;
