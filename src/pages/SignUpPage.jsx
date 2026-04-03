import { useState } from "react";
import { useAuthStore } from "../store/authStore";

function SignUpPage({ onSignUpSuccess, onGoToLogin }) {
  const signUp = useAuthStore((state) => state.signUp);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "" });

  const submit = async (event) => {
    event.preventDefault();
    const success = await signUp(form);
    if (success) onSignUpSuccess();
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-gray-800 bg-zinc-900 p-6 shadow-lg">
      <h1 className="mb-5 text-2xl font-semibold text-white">Sign up</h1>
      <form className="space-y-3" onSubmit={submit}>
        <input
          type="text"
          required
          disabled={authLoading}
          value={form.name}
          placeholder="Full name"
          onChange={(event) => {
            clearAuthError();
            setForm((current) => ({ ...current, name: event.target.value }));
          }}
          className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-white"
        />
        <input
          type="email"
          required
          disabled={authLoading}
          value={form.email}
          placeholder="Email"
          onChange={(event) => {
            clearAuthError();
            setForm((current) => ({ ...current, email: event.target.value }));
          }}
          className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-white"
        />
        <input
          type="text"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_-]+"
          disabled={authLoading}
          value={form.username}
          placeholder="Unique name (used in shareable URL)"
          onChange={(event) => {
            clearAuthError();
            setForm((current) => ({ ...current, username: event.target.value }));
          }}
          className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-white"
        />
        <input
          type="password"
          required
          minLength={6}
          disabled={authLoading}
          value={form.password}
          placeholder="Password"
          onChange={(event) => {
            clearAuthError();
            setForm((current) => ({ ...current, password: event.target.value }));
          }}
          className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-white"
        />
        {authError && <p className="text-sm text-rose-400">{authError}</p>}
        <button
          type="submit"
          disabled={authLoading}
          className="w-full rounded-md bg-orange-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {authLoading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <button
        type="button"
        disabled={authLoading}
        onClick={onGoToLogin}
        className="mt-4 text-sm text-sky-300 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        Already have an account? Login
      </button>
    </div>
  );
}

export default SignUpPage;
