export const PUBLIC_SHEET_API_BASE_URL =
  import.meta.env.VITE_PUBLIC_SHEET_API_BASE_URL ||
  "https://node.codolio.com/api/question-tracker/v1/sheet/public/get-sheet-by-slug";

export const SYNC_API_BASE_URL =
  import.meta.env.VITE_SYNC_API_BASE_URL || "/api/sync/outbox";
