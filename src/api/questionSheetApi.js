const API_BASE_URL =
  "https://node.codolio.com/api/question-tracker/v1/sheet/public/get-sheet-by-slug/striver-sde-sheet";
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
    };
  }
  return normalizeSheet(sheet ?? localSheet ?? { topics: [] });
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

export const createTopic = (sheet, title) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: [...currentSheet.topics, createTopicEntry(title)],
  };
  writeLocalSheet(updatedSheet);
  return Promise.resolve(updatedSheet);
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
  writeLocalSheet(updatedSheet);
  return Promise.resolve(updatedSheet);
};

export const deleteTopic = (sheet, topicId) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: currentSheet.topics.filter((topic) => topic.id !== topicId),
  };
  writeLocalSheet(updatedSheet);
  return Promise.resolve(updatedSheet);
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
  writeLocalSheet(updatedSheet);
  return Promise.resolve(updatedSheet);
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
  writeLocalSheet(updatedSheet);
  return Promise.resolve(updatedSheet);
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
  writeLocalSheet(updatedSheet);
  return Promise.resolve(updatedSheet);
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
  writeLocalSheet(updatedSheet);
  return Promise.resolve(updatedSheet);
};

export const updateQuestion = (sheet, topicId, subId, questionId, newText) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: updateTopicById(currentSheet.topics, topicId, (topic) => ({
      ...topic,
      subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
        ...subTopic,
        questions: updateQuestionById(
          subTopic.questions,
          questionId,
          (question) => ({ ...question, text: newText })
        ),
      })),
    })),
  };
  writeLocalSheet(updatedSheet);
  return Promise.resolve(updatedSheet);
};

export const deleteQuestion = (sheet, topicId, subId, questionId) => {
  const currentSheet = resolveSheet(sheet);
  const updatedSheet = {
    ...currentSheet,
    topics: updateTopicById(currentSheet.topics, topicId, (topic) => ({
      ...topic,
      subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
        ...subTopic,
        questions: subTopic.questions.filter(
          (question) => question.id !== questionId
        ),
      })),
    })),
  };
  writeLocalSheet(updatedSheet);
  return Promise.resolve(updatedSheet);
};