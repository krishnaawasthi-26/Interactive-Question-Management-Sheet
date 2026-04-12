import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";

function SignUpPage({ theme, onThemeChange, onSignUpSuccess, onGoToLogin }) {
  const signUp = useAuthStore((state) => state.signUp);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "" });

  const submitSignUp = async (event) => {
    event.preventDefault();
    const success = await signUp(form);
    if (success) onSignUpSuccess();
  };

  return (
    <AppShell title="Create account" subtitle="Start building your sheet workspace" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel mx-auto mt-6 w-full max-w-xl p-6">
        <form className="space-y-3" onSubmit={submitSignUp}>
          <input type="text" required disabled={authLoading} value={form.name} placeholder="Full name" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, name: event.target.value })); }} className="field-base w-full" />
          <input type="email" required disabled={authLoading} value={form.email} placeholder="Email" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, email: event.target.value })); }} className="field-base w-full" />
          <input type="text" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_-]+" disabled={authLoading} value={form.username} placeholder="Unique name (used in shareable URL)" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, username: event.target.value })); }} className="field-base w-full" />
          <input type="password" required minLength={6} disabled={authLoading} value={form.password} placeholder="Password" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, password: event.target.value })); }} className="field-base w-full" />
          {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
          <button type="submit" disabled={authLoading} className="btn-base btn-primary w-full">{authLoading ? "Creating account..." : "Create account"}</button>
        </form>
        <button type="button" disabled={authLoading} onClick={onGoToLogin} className="mt-4 text-sm text-[var(--accent-info)]">Already have an account? Login</button>
      </div>
    </AppShell>
  );
}

export default SignUpPage;
