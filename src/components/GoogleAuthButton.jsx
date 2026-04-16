import { useEffect, useMemo, useRef, useState } from "react";
import { getGoogleClientConfig } from "../api/authApi";
import { googleAuthClientId, googleAuthEnabled } from "../config/envConfig";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_UNAVAILABLE_MESSAGE = "Google Sign-In is currently unavailable.";

function GoogleAuthButton({ disabled = false, onCredential, onError, text = "continue_with" }) {
  const hostRef = useRef(null);
  const didReportErrorRef = useRef(false);

  const [scriptReady, setScriptReady] = useState(false);
  const [googleAuthClientIdState, setGoogleAuthClientIdState] = useState(() => googleAuthClientId);
  const [configLookupComplete, setConfigLookupComplete] = useState(false);

  const isGoogleAuthConfigured = useMemo(() => Boolean(googleAuthClientIdState), [googleAuthClientIdState]);

  useEffect(() => {
    let active = true;
    console.info("[GoogleAuthButton] Loading Google client config.", {
      frontendGoogleConfigured: googleAuthEnabled,
    });
    getGoogleClientConfig()
      .then((config) => {
        if (!active) {
          return;
        }

        console.info("[GoogleAuthButton] Backend config response received.", {
          googleAuthEnabled: Boolean(config?.googleAuthEnabled),
          googleAuthClientIdConfigured: Boolean(config?.googleAuthClientIdConfigured),
        });

        if (config?.googleAuthEnabled && typeof config?.clientId === "string" && config.clientId.trim().length > 0) {
          const backendClientId = config.clientId.trim();
          setGoogleAuthClientIdState(backendClientId);
          if (googleAuthClientId && googleAuthClientId !== backendClientId) {
            console.warn("[GoogleAuthButton] Frontend/backend Google client IDs differ. Using backend value.");
          }
          return;
        }

        if (googleAuthClientId) {
          console.warn("[GoogleAuthButton] Backend Google client ID missing; using frontend env fallback.");
          return;
        }

        onError?.("Google Sign-In is not configured. Missing Google client ID.");
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error("[GoogleAuthButton] Failed to load backend Google config.", error);
        if (!googleAuthClientId && !didReportErrorRef.current) {
          didReportErrorRef.current = true;
          onError?.(GOOGLE_UNAVAILABLE_MESSAGE);
        }
      })
      .finally(() => {
        if (active) {
          setConfigLookupComplete(true);
        }
      });

    return () => {
      active = false;
    };
  }, [onError]);

  useEffect(() => {
    if (!isGoogleAuthConfigured) {
      console.warn("[GoogleAuthButton] Google Sign-In skipped because client ID is not configured.");
      return;
    }

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    const handleReady = () => setScriptReady(true);

    if (existing) {
      if (window.google?.accounts?.id) {
        console.info("[GoogleAuthButton] Google script already loaded.");
        handleReady();
      } else {
        existing.addEventListener("load", handleReady, { once: true });
      }

      return () => {
        existing.removeEventListener("load", handleReady);
      };
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = handleReady;
    script.onerror = () => {
      if (didReportErrorRef.current) {
        return;
      }
      didReportErrorRef.current = true;
      console.error("[GoogleAuthButton] Google script failed to load.");
      onError?.(GOOGLE_UNAVAILABLE_MESSAGE);
    };

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [isGoogleAuthConfigured, onError]);

  useEffect(() => {
    if (!scriptReady || !hostRef.current || !window.google?.accounts?.id || !isGoogleAuthConfigured) {
      return;
    }

    try {
      console.info("[GoogleAuthButton] Initializing Google Identity Services.");
      window.google.accounts.id.initialize({
        client_id: googleAuthClientIdState,
        callback: (response) => {
          console.info("[GoogleAuthButton] Google callback started.", {
            hasCredential: Boolean(response?.credential),
            selectBy: response?.select_by ?? null,
          });
          if (!response?.credential) {
            onError?.("Google did not return a valid token. Please try again.");
            return;
          }
          onCredential?.(response.credential);
        },
      });

      hostRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(hostRef.current, {
        type: "standard",
        theme: "outline",
        shape: "pill",
        width: 320,
        text,
        size: "large",
      });
    } catch {
      if (didReportErrorRef.current) {
        return;
      }
      didReportErrorRef.current = true;
      console.error("[GoogleAuthButton] Failed to initialize/render Google button.");
      onError?.(GOOGLE_UNAVAILABLE_MESSAGE);
    }
  }, [googleAuthClientIdState, scriptReady, isGoogleAuthConfigured, onCredential, onError, text]);

  if (!isGoogleAuthConfigured && configLookupComplete) {
    return <p className="text-xs text-[var(--accent-danger)]">{GOOGLE_UNAVAILABLE_MESSAGE}</p>;
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <div ref={hostRef} aria-label="Continue with Google" />
    </div>
  );
}

export default GoogleAuthButton;
