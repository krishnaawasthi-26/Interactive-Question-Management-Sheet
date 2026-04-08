import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import SiteNav from "../components/SiteNav";

function LoginPage({ onLoginSuccess, onGoToSignUp }) {
  const login = useAuthStore((state) => state.login);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const loginBlockedUntil = useAuthStore((state) => state.loginBlockedUntil);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [now, setNow] = useState(Date.now());
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

  return (
    <div className="app-shell text-[var(--text-primary)]">
      <div className="app-content">
        <SiteNav />
      </div>
      <div className="mt-6 w-full max-w-xl rounded-xl border border-gray-800 bg-zinc-900 p-6 shadow-lg">
        <h1 className="mb-5 text-2xl font-semibold text-white">Login</h1>
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
          className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-white"
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
          className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-white"
        />
        {isLocked && <p className="text-sm text-amber-300">{lockMessage}</p>}
        {authError && <p className="text-sm text-rose-400">{authError}</p>}
        <button
          type="submit"
          disabled={authLoading || isLocked}
          className="w-full rounded-md bg-orange-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLocked ? `Try again in ${lockSeconds}s` : authLoading ? "Checking account..." : "Login"}
        </button>
        </form>
        <button
          type="button"
          disabled={authLoading}
          onClick={onGoToSignUp}
          className="mt-4 text-sm text-sky-300 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Don&apos;t have an account? Sign up
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
