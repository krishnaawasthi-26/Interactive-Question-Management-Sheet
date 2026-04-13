import { apiRequest } from "../api/apiClient";

let googleAuthConfigPromise;

const normalizeClientId = (value) => (typeof value === "string" ? value.trim() : "");

export const loadGoogleAuthConfig = async () => {
  if (!googleAuthConfigPromise) {
    googleAuthConfigPromise = apiRequest("/api/auth/google/config").then((payload) => {
      const clientId = normalizeClientId(payload?.clientId);
      if (!clientId) {
        throw new Error(
          "Google Sign-In is not configured. Backend must provide APP_AUTH_GOOGLE_CLIENT_ID."
        );
      }
      return { clientId };
    });
  }

  return googleAuthConfigPromise;
};
