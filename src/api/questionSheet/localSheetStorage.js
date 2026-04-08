export const LOCAL_STORAGE_KEY = "question-sheet";
export const OUTBOX_STORAGE_KEY = "iqms-outbox";

const isBrowser = typeof window !== "undefined";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const readLocalSheet = (slug) => {
  if (!isBrowser) return null;

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;

  const parsed = safeParse(raw, null);
  if (!parsed) return null;
  if (slug && parsed?.slug && parsed.slug !== slug) return null;

  return parsed;
};

export const writeLocalSheet = (sheet) => {
  if (!isBrowser) return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sheet));
};

export const readOutbox = () => {
  if (!isBrowser) return [];

  const raw = window.localStorage.getItem(OUTBOX_STORAGE_KEY);
  if (!raw) return [];

  return safeParse(raw, []);
};

export const writeOutbox = (operations) => {
  if (!isBrowser) return;
  window.localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(operations));
};

export const isBrowserEnvironment = () => isBrowser;
