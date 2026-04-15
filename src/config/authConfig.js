import { apiRequest } from "../api/apiClient";

let googleAuthConfigPromise;

const normalizeClientId = (value) => (typeof value === "string" ? value.trim() : "");
const fallbackClientId = normalizeClientId(
  import.meta.env.VITE_APP_AUTH_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID,
);

export const loadGoogleAuthConfig = async () => {
  if (!googleAuthConfigPromise) {
    googleAuthConfigPromise = apiRequest("/api/auth/google/config")
      .then((payload) => {
        const clientId = normalizeClientId(payload?.clientId) || fallbackClientId;
        if (!clientId) {
          throw new Error(
            "Google Sign-In is not configured. Set APP_AUTH_GOOGLE_CLIENT_ID in backend or VITE_APP_AUTH_GOOGLE_CLIENT_ID in frontend."
          );
        }
        return { clientId };
      })
      .catch((error) => {
        if (!fallbackClientId) throw error;
        return { clientId: fallbackClientId };
      });
  }

  return googleAuthConfigPromise;
};
