import { apiRequest } from "../api/apiClient";

let googleAuthConfigPromise;

const normalizeClientId = (value) => (typeof value === "string" ? value.trim() : "");
const fallbackClientId = normalizeClientId(
  import.meta.env.VITE_APP_AUTH_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID,
);

const GOOGLE_AUTH_CONFIG_MISSING_CODE = "GOOGLE_AUTH_CONFIG_MISSING";

const createMissingConfigError = () => {
  const error = new Error(
    "Google Sign-In is disabled because no Google Web Client ID is configured. Set APP_AUTH_GOOGLE_CLIENT_ID on the backend or VITE_APP_AUTH_GOOGLE_CLIENT_ID (or VITE_GOOGLE_CLIENT_ID) on the frontend."
  );
  error.code = GOOGLE_AUTH_CONFIG_MISSING_CODE;
  return error;
};

export const isGoogleAuthMissingConfigError = (error) => error?.code === GOOGLE_AUTH_CONFIG_MISSING_CODE;

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
        throw isGoogleAuthMissingConfigError(error) ? error : createMissingConfigError();
      });
  }

  return googleAuthConfigPromise;
};
