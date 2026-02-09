const API_BASE_URL =
  "https://node.codolio.com/api/question-tracker/v1/sheet/public/get-sheet-by-slug";
const LOCAL_STORAGE_KEY = "question-sheet";

const isBrowser = typeof window !== "undefined";

const readLocalSheet = (slug) => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (slug && parsed?.slug && parsed.slug !== slug) return null;
  return parsed;
};

const writeLocalSheet = (sheet) => {
  if (!isBrowser) return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sheet));
};

const normalizeSheet = (payload, slug) => {
  const topics = payload?.topics ?? payload?.topicList ?? [];
  return {
    slug: payload?.slug ?? slug ?? "local-sheet",
    title: payload?.title ?? payload?.name ?? "Question Sheet",
    topics,
  };
};

export const fetchSheetBySlug = async (slug) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${slug}`);
    if (!response.ok) throw new Error("Failed to fetch sheet");
    const data = await response.json();
    const payload = data?.data?.sheet ?? data?.data ?? data?.sheet ?? data;
    const sheet = normalizeSheet(payload, slug);
    writeLocalSheet(sheet);
    return sheet;
  } catch (error) {
    const localSheet = readLocalSheet(slug);
    if (localSheet) return localSheet;
    return normalizeSheet({ topics: [] }, slug);
  }
};

export const persistSheet = (sheet) => {
  writeLocalSheet(sheet);
  return Promise.resolve(sheet);
};
