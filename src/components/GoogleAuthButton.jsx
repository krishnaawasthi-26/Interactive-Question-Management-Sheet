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
  const [configLookupComplete, setConfigLookupComplete] = useState(() => googleAuthEnabled);

  const isGoogleAuthConfigured = useMemo(() => Boolean(googleAuthClientIdState), [googleAuthClientIdState]);

  useEffect(() => {
    let active = true;

    if (googleAuthEnabled) {
      return () => {
        active = false;
      };
    }

    getGoogleClientConfig()
      .then((config) => {
        if (!active) {
          return;
        }

        if (config?.googleAuthEnabled && typeof config?.clientId === "string" && config.clientId.trim()) {
          setGoogleAuthClientIdState(config.clientId.trim());
        }
      })
      .catch(() => {
        if (!active || didReportErrorRef.current) {
          return;
        }
        didReportErrorRef.current = true;
        onError?.(GOOGLE_UNAVAILABLE_MESSAGE);
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
      return;
    }

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    const handleReady = () => setScriptReady(true);

    if (existing) {
      if (window.google?.accounts?.id) {
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
      window.google.accounts.id.initialize({
        client_id: googleAuthClientIdState,
        callback: (response) => {
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
