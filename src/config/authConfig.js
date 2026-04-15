import { apiRequest } from "../api/apiClient";

let googleAuthConfigPromise;

const normalizeClientId = (value) => (typeof value === "string" ? value.trim() : "");

const parseClientIdList = (value) => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .map((entry) => {
      if (entry.length >= 2) {
        const wrappedInDoubleQuotes = entry.startsWith('"') && entry.endsWith('"');
        const wrappedInSingleQuotes = entry.startsWith("'") && entry.endsWith("'");
        if (wrappedInDoubleQuotes || wrappedInSingleQuotes) {
          return entry.slice(1, -1).trim();
        }
      }
      return entry;
    })
    .filter(Boolean);
};

const resolveFrontendGoogleClientId = () => {
  const primaryClientId = normalizeClientId(import.meta.env.VITE_APP_AUTH_GOOGLE_CLIENT_ID);
  if (primaryClientId) {
    return primaryClientId;
  }

  const legacyAliasClientId = normalizeClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  if (legacyAliasClientId) {
    return legacyAliasClientId;
  }

  const listClientId = parseClientIdList(import.meta.env.VITE_APP_AUTH_GOOGLE_CLIENT_IDS)[0];
  if (listClientId) {
    return listClientId;
  }

  return parseClientIdList(import.meta.env.VITE_GOOGLE_CLIENT_IDS)[0] || "";
};
const fallbackClientId = resolveFrontendGoogleClientId();

const GOOGLE_AUTH_CONFIG_MISSING_CODE = "GOOGLE_AUTH_CONFIG_MISSING";

const createMissingConfigError = () => {
  const error = new Error(
    "Google Sign-In is disabled because no Google Web Client ID is configured. Backend accepts APP_AUTH_GOOGLE_CLIENT_ID / APP_AUTH_GOOGLE_CLIENT_IDS (also GOOGLE_CLIENT_ID / GOOGLE_CLIENT_IDS / GOOGLE_WEB_CLIENT_ID / GOOGLE_WEB_CLIENT_IDS). Frontend accepts VITE_APP_AUTH_GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID (or *_CLIENT_IDS variants). Then restart both apps."
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
  if (!googleAuthConfigPromise) {
    googleAuthConfigPromise = apiRequest("/api/auth/google/config")
      .then((payload) => {
        const clientId = normalizeClientId(payload?.clientId) || fallbackClientId;
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
