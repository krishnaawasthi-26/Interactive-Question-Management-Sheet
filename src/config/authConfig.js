const normalizeEntry = (entry) => {
  if (typeof entry !== "string") return "";
  const trimmed = entry.trim();
  if (!trimmed) return "";

  const unquoted = trimmed.replace(/^(["'])(.*)\1$/, "$2").trim();
  return unquoted;
};

const toList = (raw) => {
  if (!raw || typeof raw !== "string") return [];

  return raw
    .split(",")
    .map((entry) => normalizeEntry(entry))
    .filter(Boolean);
};

const runtimeEnv = (typeof import.meta !== "undefined" && import.meta.env) || {};
const DEFAULT_GOOGLE_CLIENT_ID =
  "69284629770-hsaoj4qr3rs3e4d1hc2276pu0vljlf3a.apps.googleusercontent.com";

export const GOOGLE_CLIENT_IDS = Array.from(
  new Set([
    ...toList(runtimeEnv.VITE_APP_AUTH_GOOGLE_CLIENT_ID),
    ...toList(runtimeEnv.VITE_GOOGLE_CLIENT_ID),
    ...toList(runtimeEnv.VITE_APP_GOOGLE_CLIENT_ID),
    ...toList(runtimeEnv.VITE_APP_AUTH_GOOGLE_CLIENT_IDS),
    ...toList(runtimeEnv.VITE_GOOGLE_CLIENT_IDS),
    ...toList(runtimeEnv.VITE_APP_GOOGLE_CLIENT_IDS),
    ...toList(runtimeEnv.APP_AUTH_GOOGLE_CLIENT_ID),
    ...toList(runtimeEnv.GOOGLE_CLIENT_ID),
    ...toList(runtimeEnv.APP_GOOGLE_CLIENT_ID),
    ...toList(runtimeEnv.APP_AUTH_GOOGLE_CLIENT_IDS),
    ...toList(runtimeEnv.GOOGLE_CLIENT_IDS),
    ...toList(runtimeEnv.APP_GOOGLE_CLIENT_IDS),
    DEFAULT_GOOGLE_CLIENT_ID,
  ])
);

export const GOOGLE_CLIENT_ID = GOOGLE_CLIENT_IDS[0] ?? "";
