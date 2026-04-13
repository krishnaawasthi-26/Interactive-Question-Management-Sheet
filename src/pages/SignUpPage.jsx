import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { loadGoogleAuthConfig } from "../config/authConfig";
import AppShell from "../components/AppShell";

function SignUpPage({ theme, onThemeChange, onSignUpSuccess, onGoToLogin }) {
  const requestSignUpOtp = useAuthStore((state) => state.requestSignUpOtp);
  const verifySignUpOtp = useAuthStore((state) => state.verifySignUpOtp);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const authError = useAuthStore((state) => state.authError);
  const authLoading = useAuthStore((state) => state.authLoading);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "" });
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const googleButtonRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState("");

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
          if (success) onSignUpSuccess();
        },
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: theme === "light" ? "outline" : "filled_black",
        text: "signup_with",
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
  }, [loginWithGoogle, onSignUpSuccess, theme]);

  const submitSignUpDetails = async (event) => {
    event.preventDefault();
    const challenge = await requestSignUpOtp(form);
    if (challenge?.verificationId) {
      setVerificationId(challenge.verificationId);
    }
  };

  const submitOtpVerification = async (event) => {
    event.preventDefault();
    const success = await verifySignUpOtp({ verificationId, otp });
    if (success) onSignUpSuccess();
  };

  return (
    <AppShell title="Create account" subtitle="Start building your sheet workspace" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel mx-auto mt-6 w-full max-w-xl p-6">
        {!verificationId ? (
          <form className="space-y-3" onSubmit={submitSignUpDetails}>
            <input type="text" required disabled={authLoading} value={form.name} placeholder="Full name" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, name: event.target.value })); }} className="field-base w-full" />
            <input type="email" required disabled={authLoading} value={form.email} placeholder="Email" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, email: event.target.value })); }} className="field-base w-full" />
            <input type="text" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_-]+" disabled={authLoading} value={form.username} placeholder="Unique name (used in shareable URL)" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, username: event.target.value })); }} className="field-base w-full" />
            <input type="password" required minLength={6} disabled={authLoading} value={form.password} placeholder="Password" onChange={(event) => { clearAuthError(); setForm((current) => ({ ...current, password: event.target.value })); }} className="field-base w-full" />
            {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
            <button type="submit" disabled={authLoading} className="btn-base btn-primary w-full">{authLoading ? "Sending OTP..." : "Send OTP"}</button>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={submitOtpVerification}>
            <p className="text-sm text-[var(--text-muted)]">OTP sent to <span className="font-semibold">{form.email}</span>. Enter the OTP to complete sign up.</p>
            <input type="text" required disabled={authLoading} value={otp} placeholder="Enter OTP" onChange={(event) => { clearAuthError(); setOtp(event.target.value); }} className="field-base w-full" />
            {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
            <button type="submit" disabled={authLoading} className="btn-base btn-primary w-full">{authLoading ? "Verifying OTP..." : "Verify OTP & Create account"}</button>
            <button type="button" disabled={authLoading} className="btn-base w-full" onClick={() => { setVerificationId(""); setOtp(""); }}>
              Back
            </button>
          </form>
        )}

        <div className="my-4 text-center text-xs text-[var(--text-muted)]">OR</div>
        <div className="flex justify-center" ref={googleButtonRef} />
        {googleConfigError ? (
          <p className="mt-2 text-center text-xs text-[var(--accent-danger)]">{googleConfigError}</p>
        ) : (
          !googleReady && <p className="mt-2 text-center text-xs text-[var(--text-muted)]">Loading Google signup...</p>
        )}

        <button type="button" disabled={authLoading} onClick={onGoToLogin} className="mt-4 text-sm text-[var(--accent-info)]">Already have an account? Login</button>
      </div>
    </AppShell>
  );
}

export default SignUpPage;
