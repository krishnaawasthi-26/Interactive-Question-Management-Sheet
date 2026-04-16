import { useEffect, useMemo, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "../config/authConfig";
import { getGoogleClientConfig } from "../api/authApi";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function GoogleAuthButton({ disabled = false, onCredential, onError, text = "continue_with" }) {
  const hostRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [resolvedClientId, setResolvedClientId] = useState(() => GOOGLE_CLIENT_ID);
  const [configLookupComplete, setConfigLookupComplete] = useState(() => Boolean(GOOGLE_CLIENT_ID));
  const hasClientId = useMemo(() => Boolean(resolvedClientId), [resolvedClientId]);

  useEffect(() => {
    let active = true;

    if (GOOGLE_CLIENT_ID) {
      return () => {
        active = false;
      };
    }

    getGoogleClientConfig()
      .then((config) => {
        if (!active) return;
        if (typeof config?.clientId === "string" && config.clientId.trim()) {
          setResolvedClientId(config.clientId.trim());
        }
      })
      .catch(() => {
        if (!active) return;
        onError?.("Google Sign-In setup is incomplete. Configure Google auth on the server.");
      })
      .finally(() => {
        if (active) setConfigLookupComplete(true);
      });

    return () => {
      active = false;
    };
  }, [onError]);

  useEffect(() => {
    if (!hasClientId) return;

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    const handleReady = () => setScriptReady(true);

    if (existing) {
      if (window.google?.accounts?.id) {
        handleReady();
      } else {
        existing.addEventListener("load", handleReady, { once: true });
      }
      return () => existing.removeEventListener("load", handleReady);
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = handleReady;
    script.onerror = () => onError?.("Unable to load Google Sign-In right now.");
    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [hasClientId, onError]);

  useEffect(() => {
    if (!scriptReady || !hostRef.current || !window.google?.accounts?.id || !hasClientId) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: resolvedClientId,
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
      onError?.("Unable to initialize Google Sign-In.");
    }
  }, [resolvedClientId, scriptReady, hasClientId, onCredential, onError, text]);

  if (!hasClientId && configLookupComplete) {
    return <p className="text-xs text-[var(--accent-danger)]">Google Sign-In is unavailable. Configure Google auth on the server and retry.</p>;
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <div ref={hostRef} aria-label="Continue with Google" />
    </div>
  );
}

export default GoogleAuthButton;
