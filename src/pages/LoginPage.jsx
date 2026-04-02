import { useState } from "react";
import { useAuthStore } from "../store/authStore";

function LoginPage({ onLoginSuccess, onGoToSignUp }) {
  const login = useAuthStore((state) => state.login);
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = (event) => {
    event.preventDefault();
    const success = login(form);
    if (success) onLoginSuccess();
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-gray-800 bg-zinc-900 p-6 shadow-lg">
      <h1 className="mb-5 text-2xl font-semibold text-white">Login</h1>
      <form className="space-y-3" onSubmit={submit}>
        <input
          type="email"
          required
          value={form.email}
          placeholder="Email"
          onChange={(event) => {
            clearAuthError();
            setForm((current) => ({ ...current, email: event.target.value }));
          }}
          className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-white"
        />
        <input
          type="password"
          required
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
          className="w-full rounded-md bg-orange-600 px-4 py-2 font-medium text-white"
        >
          Login
        </button>
      </form>
      <button
        type="button"
        onClick={onGoToSignUp}
        className="mt-4 text-sm text-sky-300 hover:text-sky-200"
      >
        Don&apos;t have an account? Sign up
      </button>
    </div>
  );
}

export default LoginPage;
