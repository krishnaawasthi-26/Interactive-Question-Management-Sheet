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
            <input type="password" required minLength={6} disabled={authLoading} value={form.password} placeholder="Create a password" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, password: event.target.value })); }} className="field-base w-full" />
          </label>
          {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
          <button type="submit" disabled={authLoading} className="btn-base btn-primary w-full">{authLoading ? "Creating account..." : "Create account"}</button>
        </form>

        <button type="button" disabled={authLoading} onClick={onGoToLogin} className="link-base mt-4 text-sm">Already have an account? Login</button>
      </div>
    </AppShell>
  );
}

export default SignUpPage;
