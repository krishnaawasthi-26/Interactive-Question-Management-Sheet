const toList = (raw) => {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const GOOGLE_CLIENT_IDS = Array.from(
  new Set([
    ...toList(import.meta.env.VITE_APP_AUTH_GOOGLE_CLIENT_ID),
    ...toList(import.meta.env.VITE_GOOGLE_CLIENT_ID),
    ...toList(import.meta.env.VITE_APP_AUTH_GOOGLE_CLIENT_IDS),
    ...toList(import.meta.env.VITE_GOOGLE_CLIENT_IDS),
  ])
);

export const GOOGLE_CLIENT_ID = GOOGLE_CLIENT_IDS[0] ?? "";
