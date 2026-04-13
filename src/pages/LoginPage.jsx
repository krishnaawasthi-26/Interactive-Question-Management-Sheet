import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { loadGoogleAuthConfig } from "../config/authConfig";
import AppShell from "../components/AppShell";

function LoginPage({ theme, onThemeChange, onLoginSuccess, onGoToSignUp }) {
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const loginBlockedUntil = useAuthStore((state) => state.loginBlockedUntil);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [now, setNow] = useState(() => Date.now());
  const googleButtonRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState("");
  const lockSeconds = Math.max(0, Math.ceil((loginBlockedUntil - now) / 1000));
  const isLocked = lockSeconds > 0;

  useEffect(() => {
    if (!isLocked) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isLocked]);

  useEffect(() => {
    const scriptId = "google-identity-service";
    const script = document.getElementById(scriptId) || document.createElement("script");
    if (!script.id) {
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const setupGoogle = async () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      let googleConfig;
      try {
        googleConfig = await loadGoogleAuthConfig();
      } catch (error) {
        setGoogleConfigError(error?.message || "Google Sign-In configuration failed to load.");
        setGoogleReady(false);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleConfig.clientId,
        callback: async (response) => {
          if (!response?.credential) return;
          const success = await loginWithGoogle({ idToken: response.credential });
          if (success) onLoginSuccess();
        },
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: theme === "light" ? "outline" : "filled_black",
        text: "continue_with",
        shape: "rectangular",
        width: "320",
      });
      setGoogleConfigError("");
      setGoogleReady(true);
    };

    if (script.getAttribute("data-loaded") === "true") {
      void setupGoogle();
      return;
    }

    const onGoogleScriptLoad = () => {
      script.setAttribute("data-loaded", "true");
      void setupGoogle();
    };

    script.addEventListener("load", onGoogleScriptLoad);

    return () => {
      script.removeEventListener("load", onGoogleScriptLoad);
    };
  }, [loginWithGoogle, onLoginSuccess, theme]);

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
          <button type="submit" disabled={authLoading || isLocked} className="btn-base btn-primary w-full">
            {isLocked ? `Try again in ${lockSeconds}s` : authLoading ? "Checking account..." : "Login"}
          </button>
        </form>

        <div className="my-4 text-center text-xs text-[var(--text-muted)]">OR</div>
        <div className="flex justify-center" ref={googleButtonRef} />
        {googleConfigError ? (
          <p className="mt-2 text-center text-xs text-[var(--accent-danger)]">{googleConfigError}</p>
        ) : (
          !googleReady && <p className="mt-2 text-center text-xs text-[var(--text-muted)]">Loading Google login...</p>
        )}

        <button type="button" disabled={authLoading} onClick={onGoToSignUp} className="mt-4 text-sm text-[var(--accent-info)]">
          Don&apos;t have an account? Sign up
        </button>
      </div>
    </AppShell>
  );
}

export default LoginPage;
