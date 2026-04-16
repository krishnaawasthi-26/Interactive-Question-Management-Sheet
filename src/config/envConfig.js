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

const readEnvList = (keys) => {
  const values = [];
  for (const key of keys) {
    const raw = getRawEnv(key);
    if (!raw || isPlaceholder(raw)) {
      continue;
    }

    raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value && !isPlaceholder(value))
      .forEach((value) => values.push(value));
  }

  return [...new Set(values)];
};

const isLocalHostname = (hostname) => {
  const normalized = `${hostname || ""}`.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1";
};

const isLocalApiUrl = (value) => {
  if (!value) return false;

  try {
    const parsed = new URL(value, "http://localhost");
    return isLocalHostname(parsed.hostname);
  } catch {
    return false;
  }
};

const resolveApiBaseUrl = () => {
  const configured = readEnvValue(["VITE_API_BASE_URL", "VITE_APP_API_BASE_URL"]);
  const inBrowser = typeof window !== "undefined";
  const browserOrigin = inBrowser ? window.location?.origin : "";
  const browserHostname = inBrowser ? window.location?.hostname : "";
  const isDeployedFrontend = inBrowser && browserOrigin && !isLocalHostname(browserHostname);

  if (configured) {
    if (isDeployedFrontend && isLocalApiUrl(configured)) {
      console.warn(
        `[envConfig] Ignoring local API base URL "${configured}" on deployed frontend (${browserOrigin}). Falling back to same-origin API.`
      );
      return browserOrigin;
    }

    return configured;
  }

  if (isDeployedFrontend) {
    return browserOrigin;
  }

  return "http://localhost:8080";
};

export const googleAuthClientIds = readEnvList([
  "VITE_APP_AUTH_GOOGLE_CLIENT_IDS",
  "VITE_GOOGLE_CLIENT_IDS",
  "VITE_APP_AUTH_GOOGLE_CLIENT_ID",
  "VITE_GOOGLE_CLIENT_ID",
]);
export const googleAuthClientId = googleAuthClientIds[0] || "";
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
