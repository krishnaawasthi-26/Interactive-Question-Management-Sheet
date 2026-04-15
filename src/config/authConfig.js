import { apiRequest } from "../api/apiClient";

let googleAuthConfigPromise;
let hasLoggedGoogleClientDetection = false;

const normalizeClientId = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : "";
};

export const getFrontendGoogleClientId = () => {
  const primaryClientId = normalizeClientId(import.meta.env.VITE_APP_AUTH_GOOGLE_CLIENT_ID);
  if (primaryClientId) {
    return primaryClientId;
  }

  const legacyAliasClientId = normalizeClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  return legacyAliasClientId || "";
};

const logFrontendGoogleConfigDetection = (clientId) => {
  if (hasLoggedGoogleClientDetection) {
    return;
  }
  hasLoggedGoogleClientDetection = true;
  console.info(`Google OAuth client ID detected: ${clientId ? "yes" : "no"}`);
};

const GOOGLE_AUTH_CONFIG_MISSING_CODE = "GOOGLE_AUTH_CONFIG_MISSING";

const createMissingConfigError = () => {
  const error = new Error(
    "Google Sign-In is disabled because no Google Web Client ID is configured. Backend accepts APP_AUTH_GOOGLE_CLIENT_ID / APP_AUTH_GOOGLE_CLIENT_IDS. Frontend accepts VITE_APP_AUTH_GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID. Then restart both apps."
  );
  error.code = GOOGLE_AUTH_CONFIG_MISSING_CODE;
  return error;
};

export const isGoogleAuthMissingConfigError = (error) => error?.code === GOOGLE_AUTH_CONFIG_MISSING_CODE;

export const getGoogleAuthDisabledReason = (error) => {
  if (!error) return "";
  if (isGoogleAuthMissingConfigError(error)) {
    return error.message;
  }

  const status = Number(error?.status);
  if (status === 404) {
    return "Google Sign-In config endpoint is missing on this deployment (/api/auth/google/config returned 404). Deploy the backend auth routes and try again.";
  }
  if (status === 500 || status === 503) {
    return `Google Sign-In config endpoint failed with HTTP ${status}. Check backend APP_AUTH_GOOGLE_CLIENT_ID or APP_AUTH_GOOGLE_CLIENT_IDS.`;
  }

  return error?.message || "Google Sign-In configuration failed to load.";
};

export const loadGoogleAuthConfig = async () => {
  const fallbackClientId = getFrontendGoogleClientId();
  logFrontendGoogleConfigDetection(fallbackClientId);

  if (!googleAuthConfigPromise) {
    googleAuthConfigPromise = apiRequest("/api/auth/google/config")
      .then((payload) => {
        const clientId = normalizeClientId(payload?.clientId) || fallbackClientId;
        logFrontendGoogleConfigDetection(clientId);
        if (!clientId) {
          throw createMissingConfigError();
        }
        return { clientId };
      })
      .catch((error) => {
        if (fallbackClientId) {
          return { clientId: fallbackClientId };
        }
        throw error;
      });
  }

  return googleAuthConfigPromise;
};
