const getRawEnv = (key) => {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
};

const isPlaceholder = (value) => {
  const normalized = value.toLowerCase();
  return (
    normalized.startsWith("<") ||
    normalized.includes("your_google_web_client_id") ||
    normalized.includes("your_backend_url") ||
    normalized.includes("your_api_base_url") ||
    normalized.includes("replace_me") ||
    normalized.includes("changeme")
  );
};

const readEnvValue = (keys) => {
  for (const key of keys) {
    const value = getRawEnv(key);
    if (!value || isPlaceholder(value)) {
      continue;
    }
    return value;
  }
  return "";
};

const isLocalHostname = (hostname) => {
  const normalized = `${hostname || ""}`.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1";
};

const resolveApiBaseUrl = () => {
  const configured = readEnvValue(["VITE_API_BASE_URL", "VITE_APP_API_BASE_URL"]);
  if (configured) {
    return configured;
  }

  if (typeof window !== "undefined" && window.location?.origin && !isLocalHostname(window.location.hostname)) {
    return window.location.origin;
  }

  return "http://localhost:8080";
};

export const googleAuthClientId = readEnvValue([
  "VITE_APP_AUTH_GOOGLE_CLIENT_ID",
  "VITE_GOOGLE_CLIENT_ID",
]);

export const googleAuthClientIds = googleAuthClientId ? [googleAuthClientId] : [];
export const googleAuthEnabled = googleAuthClientIds.length > 0;

export const apiBaseUrl = resolveApiBaseUrl();
export const razorpayKeyId = readEnvValue(["VITE_RAZORPAY_KEY_ID"]);
export const appName = readEnvValue(["VITE_APP_NAME"]) || "Create Sheets";

export const frontendEnvConfig = {
  apiBaseUrl,
  appName,
  googleAuthClientId,
  googleAuthClientIds,
  googleAuthEnabled,
  razorpayKeyId,
};
