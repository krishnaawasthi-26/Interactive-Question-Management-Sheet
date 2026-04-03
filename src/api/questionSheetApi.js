import sampleSheet from "../data/sampleSheet.json";

const API_BASE_URL =
  "https://node.codolio.com/api/question-tracker/v1/sheet/public/get-sheet-by-slug/striver-sde-sheet";

const SYNC_API_BASE_URL =
  import.meta.env.VITE_SYNC_API_BASE_URL || "/api/sync/outbox";

export const LOCAL_STORAGE_KEY = "question-sheet";
export const OUTBOX_STORAGE_KEY = "iqms-outbox";
const isBrowser = typeof window !== "undefined";

let hasRegisteredOnlineSyncListener = false;
let isFlushingOutbox = false;

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readLocalSheet = (slug) => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;

  const parsed = safeParse(raw, null);
  if (!parsed) return null;
  if (slug && parsed?.slug && parsed.slug !== slug) return null;
  return parsed;
};

const writeLocalSheet = (sheet) => {
  if (!isBrowser) return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sheet));
};

const readOutbox = () => {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(OUTBOX_STORAGE_KEY);
  if (!raw) return [];
  return safeParse(raw, []);
};

const writeOutbox = (operations) => {
  if (!isBrowser) return;
  window.localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(operations));
};

const normalizeSheet = (payload, slug) => {
  const topics = payload?.topics ?? payload?.topicList ?? [];
  const title = payload?.title ?? payload?.name ?? "Question Sheet";

  return {
    slug: payload?.slug ?? slug ?? "local-sheet",
    id: payload?.id ?? `sheet_${Date.now()}`,
    title,
    name: payload?.name ?? title,
    createdAt: payload?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    topics,
  };
};

const createTopicEntry = (title) => ({
  id: Date.now(),
  title,
  subTopics: [],
});

const createSubTopicEntry = (title) => ({
  id: Date.now(),
  title,
  questions: [],
});

const createQuestionEntry = (text) => ({
  id: Date.now(),
  text,
  answer: "",
  link: "",
});

const updateTopicById = (topics, topicId, updater) =>
  topics.map((topic) => (topic.id === topicId ? updater(topic) : topic));

const updateSubTopicById = (subTopics, subId, updater) =>
  subTopics.map((subTopic) => (subTopic.id === subId ? updater(subTopic) : subTopic));

const updateQuestionById = (questions, questionId, updater) =>
  questions.map((question) =>
    question.id === questionId ? updater(question) : question
  );

const resolveSheet = (sheet) => {
  const localSheet = readLocalSheet();
  if (sheet?.topics) {
    return {
      ...(localSheet ?? {}),
      ...sheet,
      topics: sheet.topics ?? localSheet?.topics ?? [],
      updatedAt: new Date().toISOString(),
    };
  }
  return normalizeSheet(sheet ?? localSheet ?? { topics: [] });
};

const enqueueOperation = (type, sheet, payload = {}) => {
  const currentOutbox = readOutbox();
  const operation = {
    opId: `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    sheetId: sheet.id,
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  writeOutbox([...currentOutbox, operation]);
};

const markOperationSynced = (opId) => {
  const currentOutbox = readOutbox();
  const remaining = currentOutbox.filter((op) => op.opId !== opId);
  writeOutbox(remaining);
};

const syncSingleOperation = async (operation) => {
  await fetch(SYNC_API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ operations: [operation] }),
  });
};

export const flushOutbox = async () => {
  if (!isBrowser || isFlushingOutbox || !navigator.onLine) return;

  const pendingOperations = readOutbox();
  if (pendingOperations.length === 0) return;

  isFlushingOutbox = true;

  try {
    for (const operation of pendingOperations) {
      try {
        await syncSingleOperation(operation);
        markOperationSynced(operation.opId);
      } catch {
        break;
      }
    }
  } finally {
    isFlushingOutbox = false;
  }
};

export const initBackgroundSync = () => {
  if (!isBrowser || hasRegisteredOnlineSyncListener) return;

  hasRegisteredOnlineSyncListener = true;
  window.addEventListener("online", () => {
    flushOutbox();
  });

  flushOutbox();
};

const persistSheetWithOperation = (sheet, operationType, payload = {}) => {
  writeLocalSheet(sheet);
  enqueueOperation(operationType, sheet, payload);
  flushOutbox();
  return Promise.resolve(sheet);
};

export const fetchSheetBySlug = async (slug) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${slug}`);
    if (!response.ok) throw new Error("Failed to fetch sheet");

    const data = await response.json();
    const payload = data?.data?.sheet ?? data?.data ?? data?.sheet ?? data;
    const sheet = normalizeSheet(payload, slug);
    const localSheet = readLocalSheet(slug);

    const hasLocalTopics =
      Array.isArray(localSheet?.topics) && localSheet.topics.length > 0;
    const isRemoteEmpty = !Array.isArray(sheet.topics) || sheet.topics.length === 0;

    if (!hasLocalTopics && isRemoteEmpty) {
      const fallbackSheet = normalizeSheet({ ...sampleSheet, slug }, slug);
      writeLocalSheet(fallbackSheet);
      return { ...fallbackSheet, source: "fallback", hadRemoteError: false };
    }

    if (isRemoteEmpty && hasLocalTopics) {
      return { ...localSheet, source: "local", hadRemoteError: false };
    }

    writeLocalSheet(sheet);
    return { ...sheet, source: "remote", hadRemoteError: false };
  } catch {
    const localSheet = readLocalSheet(slug);
    if (localSheet && Array.isArray(localSheet.topics) && localSheet.topics.length > 0) {
      return { ...localSheet, source: "local", hadRemoteError: true };
    }

    const fallbackSheet = normalizeSheet({ ...sampleSheet, slug }, slug);
    writeLocalSheet(fallbackSheet);
    return { ...fallbackSheet, source: "fallback", hadRemoteError: true };
  }
};

export const persistSheet = (sheet) => {
  const currentSheet = resolveSheet(sheet);
  return persistSheetWithOperation(currentSheet, "SHEET_PERSIST", { sheet: currentSheet });
};

export const setSheet = (sheet) => {
  const currentSheet = resolveSheet(sheet);
  return persistSheetWithOperation(currentSheet, "SHEET_IMPORT", { sheet: currentSheet });
};

export const createTopic = (sheet, title) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: [...currentSheet.topics, createTopicEntry(title)],
  };
  return persistSheetWithOperation(updatedSheet, "TOPIC_CREATE", { title });
};

export const updateTopic = (sheet, topicId, newTitle) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: updateTopicById(currentSheet.topics, topicId, (topic) => ({
      ...topic,
      title: newTitle,
    })),
  };
  return persistSheetWithOperation(updatedSheet, "TOPIC_UPDATE", { topicId, newTitle });
};

export const deleteTopic = (sheet, topicId) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: currentSheet.topics.filter((topic) => topic.id !== topicId),
  };
  return persistSheetWithOperation(updatedSheet, "TOPIC_DELETE", { topicId });
};

export const createSubTopic = (sheet, topicId, title) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: updateTopicById(currentSheet.topics, topicId, (topic) => ({
      ...topic,
      subTopics: [...topic.subTopics, createSubTopicEntry(title)],
    })),
  };
  return persistSheetWithOperation(updatedSheet, "SUBTOPIC_CREATE", { topicId, title });
};

export const updateSubTopic = (sheet, topicId, subId, newTitle) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: updateTopicById(currentSheet.topics, topicId, (topic) => ({
      ...topic,
      subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
        ...subTopic,
        title: newTitle,
      })),
    })),
  };
  return persistSheetWithOperation(updatedSheet, "SUBTOPIC_UPDATE", {
    topicId,
    subId,
    newTitle,
  });
};

export const deleteSubTopic = (sheet, topicId, subId) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: updateTopicById(currentSheet.topics, topicId, (topic) => ({
      ...topic,
      subTopics: topic.subTopics.filter((subTopic) => subTopic.id !== subId),
    })),
  };
  return persistSheetWithOperation(updatedSheet, "SUBTOPIC_DELETE", { topicId, subId });
};

export const createQuestion = (sheet, topicId, subId, text) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: updateTopicById(currentSheet.topics, topicId, (topic) => ({
      ...topic,
      subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
        ...subTopic,
        questions: [...subTopic.questions, createQuestionEntry(text)],
      })),
    })),
  };
  return persistSheetWithOperation(updatedSheet, "QUESTION_CREATE", { topicId, subId, text });
};

export const updateQuestion = (sheet, topicId, subId, questionId, newText) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: updateTopicById(currentSheet.topics, topicId, (topic) => ({
      ...topic,
      subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
        ...subTopic,
        questions: updateQuestionById(subTopic.questions, questionId, (question) => ({
          ...question,
          text: newText,
        })),
      })),
    })),
  };
  return persistSheetWithOperation(updatedSheet, "QUESTION_UPDATE", {
    topicId,
    subId,
    questionId,
    newText,
  });
};

export const deleteQuestion = (sheet, topicId, subId, questionId) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: updateTopicById(currentSheet.topics, topicId, (topic) => ({
      ...topic,
      subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
        ...subTopic,
        questions: subTopic.questions.filter((question) => question.id !== questionId),
      })),
    })),
  };
  return persistSheetWithOperation(updatedSheet, "QUESTION_DELETE", {
    topicId,
    subId,
    questionId,
  });
};
