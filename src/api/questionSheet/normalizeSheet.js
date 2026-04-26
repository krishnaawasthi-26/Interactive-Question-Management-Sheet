import { readLocalSheet } from "./localSheetStorage";

const fallbackId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const generateId = (prefix) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return fallbackId(prefix);
};

export const normalizeSheet = (payload, slug) => {
  const topics = payload?.topics ?? payload?.topicList ?? [];
  const title = payload?.title ?? payload?.name ?? "Question Sheet";

  return {
    slug: payload?.slug ?? slug ?? "local-sheet",
    id: payload?.id ?? generateId("sheet"),
    title,
    name: payload?.name ?? title,
    createdAt: payload?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    topics,
    topicTags: payload?.topicTags ?? [],
    userCustomTopics: payload?.userCustomTopics ?? [],
  };
};

export const resolveSheet = (sheet) => {
  const localSheet = readLocalSheet();

  if (sheet?.topics) {
    return {
      ...(localSheet ?? {}),
      ...sheet,
      topics: sheet.topics ?? localSheet?.topics ?? [],
      topicTags: sheet.topicTags ?? localSheet?.topicTags ?? [],
      userCustomTopics: sheet.userCustomTopics ?? localSheet?.userCustomTopics ?? [],
      updatedAt: new Date().toISOString(),
    };
  }

  return normalizeSheet(sheet ?? localSheet ?? { topics: [] });
};
