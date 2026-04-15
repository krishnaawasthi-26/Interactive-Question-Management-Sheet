export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const API_ENDPOINTS = {
  publicSheetBySlug: "/api/question-tracker/v1/sheet/public/get-sheet-by-slug",
  outboxSync: "/api/sync/outbox",
};

export const CLIENT_RATE_LIMIT = {
  storageKey: "iqms-client-rate-limit",
  requestLimit: 0,
  requestWindowMs: 10_000,
  cooldownMs: 5_000,
};

export const API_ERROR_MESSAGES = {
  network: "Unable to connect right now. Please try again in a moment.",
  timeout: "Request timed out. Please verify the backend is running and try again.",
  requestFailed: "Request failed. Please try again.",
  rateLimited: "Too many requests. Try after {seconds} seconds.",
};

export const API_REQUEST_TIMEOUT_MS = 12_000;

// Backward-compatible aliases.
export const PUBLIC_SHEET_API_BASE_URL = API_ENDPOINTS.publicSheetBySlug;
export const SYNC_API_BASE_URL = API_ENDPOINTS.outboxSync;
