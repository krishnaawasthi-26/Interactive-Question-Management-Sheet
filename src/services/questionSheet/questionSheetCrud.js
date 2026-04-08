import sampleSheet from "../../data/sampleSheet.json";
import { readLocalSheet, writeLocalSheet } from "../../api/questionSheet/localSheetStorage";
import { normalizeSheet, resolveSheet, generateId } from "../../api/questionSheet/normalizeSheet";
import { enqueueOperation, flushOutbox } from "../../api/questionSheet/outboxSync";
import { fetchRemoteSheetBySlug } from "../../api/questionSheet/remoteSheetApi";

const createTopicEntry = (title) => ({
  id: generateId("topic"),
  title,
  subTopics: [],
});

const createSubTopicEntry = (title) => ({
  id: generateId("subtopic"),
  title,
  questions: [],
});

const createQuestionEntry = (text) => ({
  id: generateId("question"),
  text,
  answer: "",
  link: "",
  articleLink: "",
  videoLink: "",
  notes: "",
  done: false,
});

const updateTopicById = (topics, topicId, updater) =>
  topics.map((topic) => (topic.id === topicId ? updater(topic) : topic));

const updateSubTopicById = (subTopics, subId, updater) =>
  subTopics.map((subTopic) => (subTopic.id === subId ? updater(subTopic) : subTopic));

const updateQuestionById = (questions, questionId, updater) =>
  questions.map((question) =>
    question.id === questionId ? updater(question) : question
  );

const persistSheetWithOperation = (sheet, operationType, payload = {}) => {
  writeLocalSheet(sheet);
  enqueueOperation(operationType, sheet, payload);
  flushOutbox();
  return Promise.resolve(sheet);
};

export const fetchSheetBySlug = async (slug) => {
  try {
    const payload = await fetchRemoteSheetBySlug(slug);
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
