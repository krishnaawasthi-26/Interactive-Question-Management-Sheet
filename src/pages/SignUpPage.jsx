import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { isGoogleAuthMissingConfigError, loadGoogleAuthConfig } from "../config/authConfig";
import { getGoogleAuthErrorMessage } from "../utils/googleAuthError";
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
  const [otpMessage, setOtpMessage] = useState("");
  const googleButtonRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(true);

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
        if (isGoogleAuthMissingConfigError(error)) {
          setGoogleEnabled(false);
          setGoogleConfigError("");
        } else {
          setGoogleConfigError(error?.message || "Google Sign-In configuration failed to load.");
        }
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
        error_callback: (error) => {
          setGoogleConfigError(getGoogleAuthErrorMessage(error));
          setGoogleReady(false);
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
      setGoogleEnabled(true);
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
      setOtpMessage(challenge.message || "");
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
          <form className="stack-form" onSubmit={submitSignUpDetails}>
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
            <button type="submit" disabled={authLoading} className="btn-base btn-primary w-full">{authLoading ? "Sending OTP..." : "Send OTP"}</button>
          </form>
        ) : (
          <form className="stack-form" onSubmit={submitOtpVerification}>
            <p className="text-sm text-[var(--text-muted)]">
              OTP sent to <span className="font-semibold">{form.email}</span>. Enter the OTP to complete sign up.
            </p>
            {otpMessage && <p className="text-xs text-[var(--text-muted)]">{otpMessage}</p>}
            <label>
              <span className="stack-form-label">Verification code</span>
              <input type="text" required disabled={authLoading} value={otp} placeholder="Enter OTP" onChange={(event) => { clearAuthError(); setOtp(event.target.value); }} className="field-base w-full" />
            </label>
            {authError && <p className="text-sm text-[var(--accent-danger)]">{authError}</p>}
            <button type="submit" disabled={authLoading} className="btn-base btn-primary w-full">{authLoading ? "Verifying OTP..." : "Verify OTP & Create account"}</button>
            <button type="button" disabled={authLoading} className="btn-base btn-neutral w-full" onClick={() => { setVerificationId(""); setOtp(""); setOtpMessage(""); }}>
              Back
            </button>
          </form>
        )}

        {googleEnabled ? (
          <>
            <div className="my-4 text-center text-xs text-[var(--text-muted)]">OR</div>
            <div className="flex justify-center" ref={googleButtonRef} />
            {googleConfigError ? (
              <p className="mt-2 text-center text-xs text-[var(--accent-danger)]">{googleConfigError}</p>
            ) : (
              !googleReady && <p className="mt-2 text-center text-xs text-[var(--text-muted)]">Loading Google signup...</p>
            )}
          </>
        ) : (
          <p className="mt-2 text-center text-xs text-[var(--text-muted)]">Google Sign-In is currently unavailable for this deployment.</p>
        )}

        <button type="button" disabled={authLoading} onClick={onGoToLogin} className="link-base mt-4 text-sm">Already have an account? Login</button>
      </div>
    </AppShell>
  );
}

export default SignUpPage;
