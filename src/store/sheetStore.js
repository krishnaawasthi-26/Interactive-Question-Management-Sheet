import { create } from "zustand";
import {
  createQuestion,
  createSubTopic,
  createTopic,
  deleteQuestion,
  deleteSubTopic,
  deleteTopic,
  updateQuestion,
  updateSubTopic,
  updateTopic,
} from "../api/questionSheetApi";
import { createSheet, getSheet, listSheets, removeSheet, saveSheet } from "../api/sheetApi";

const HISTORY_LIMIT = 20;
const MAX_SHEETS = 5;
const MAX_TOPICS = 50;
const MAX_SUBTOPICS = 100;
const MAX_QUESTIONS = 200;
const lastPersistedSignatureBySheet = new Map();
const inFlightPersistBySheet = new Map();

const countSubTopics = (topics) =>
  topics.reduce((count, topic) => count + (topic.subTopics?.length || 0), 0);

const countQuestions = (topics) =>
  topics.reduce(
    (count, topic) =>
      count + (topic.subTopics || []).reduce((subCount, subTopic) => subCount + (subTopic.questions?.length || 0), 0),
    0
  );

const reorderArray = (items, startIndex, endIndex) => {
  const nextItems = Array.from(items);
  const [removed] = nextItems.splice(startIndex, 1);
  nextItems.splice(endIndex, 0, removed);
  return nextItems;
};

const withHistory = (state, nextTopics) => {
  const snapshot = JSON.parse(JSON.stringify(state.topics));
  const nextPast = [...state.past, snapshot].slice(-HISTORY_LIMIT);
  return { topics: nextTopics, past: nextPast, future: [] };
};

const updateSheetInCollection = (sheets, sheetId, updates) =>
  sheets.map((sheet) => (sheet.id === sheetId ? { ...sheet, ...updates } : sheet));

export const useSheetStore = create((set, get) => ({
  sheets: [],
  activeSheetId: null,
  topics: [],
  sheetTitle: "Question Sheet",
  isLoading: false,
  loadError: null,
  loadSource: "idle",
  past: [],
  future: [],
  limitWarning: null,

  loadSheets: async (token) => {
    const sheets = await listSheets(token);
    set({ sheets });
    return sheets;
  },

  createNewSheet: async (token, title) => {
    if (get().sheets.length >= MAX_SHEETS) {
      set({ limitWarning: `Limit reached: sheet (${MAX_SHEETS})` });
      return null;
    }
    const created = await createSheet(token, title);
    set((state) => ({ sheets: [...state.sheets, created], limitWarning: null }));
    return created;
  },

  deleteSheet: async (token, sheetId) => {
    await removeSheet(token, sheetId);
    set((state) => ({ sheets: state.sheets.filter((sheet) => sheet.id !== sheetId) }));
  },


  duplicateSheet: async (token, sourceSheet, customTitle) => {
    if (get().sheets.length >= MAX_SHEETS) {
      set({ limitWarning: `Limit reached: sheet (${MAX_SHEETS})` });
      return null;
    }
    const created = await createSheet(token, customTitle || `${sourceSheet.title || sourceSheet.name || "Untitled Sheet"} (Copy)`);
    await saveSheet(token, created.id, {
      title: customTitle || `${sourceSheet.title || sourceSheet.name || "Untitled Sheet"} (Copy)`,
      topics: sourceSheet.topics || [],
    });
    set((state) => ({
      sheets: [
        ...state.sheets,
        {
          ...created,
          title: customTitle || `${sourceSheet.title || sourceSheet.name || "Untitled Sheet"} (Copy)`,
          topics: sourceSheet.topics || [],
        },
      ],
      limitWarning: null,
    }));
    return created;
  },

  duplicateSheetById: async (token, sheetId, customTitle) => {
    const sourceSheet = await getSheet(token, sheetId);
    return get().duplicateSheet(token, sourceSheet, customTitle);
  },

  setFullSheet: async (sheet) => {
    const normalized = {
      title: sheet.name || sheet.title || "Question Sheet",
      topics: sheet.topics || [],
    };
    set((state) => ({ ...state, sheetTitle: normalized.title, topics: normalized.topics, past: [], future: [] }));
    return normalized;
  },

  loadSheetById: async (token, sheetId) => {
    set({ isLoading: true, loadError: null });
    try {
      const sheet = await getSheet(token, sheetId);
      set({
        activeSheetId: sheet.id,
        topics: sheet.topics || [],
        sheetTitle: sheet.title || "Question Sheet",
        isLoading: false,
        past: [],
        future: [],
      });
      const signature = JSON.stringify({ title: sheet.title || "Question Sheet", topics: sheet.topics || [] });
      lastPersistedSignatureBySheet.set(sheet.id, signature);
      return sheet;
    } catch (error) {
      set({ isLoading: false, loadError: error.message });
      return null;
    }
  },

  persistCurrentSheet: async (token) => {
    const { activeSheetId, topics, sheetTitle } = get();
    if (!activeSheetId) return;
    const signature = JSON.stringify({ title: sheetTitle, topics });
    if (lastPersistedSignatureBySheet.get(activeSheetId) === signature) return;
    const inFlight = inFlightPersistBySheet.get(activeSheetId);
    if (inFlight?.signature === signature) {
      await inFlight.promise;
      return;
    }

    const persistPromise = saveSheet(token, activeSheetId, { title: sheetTitle, topics })
      .then(() => {
        lastPersistedSignatureBySheet.set(activeSheetId, signature);
      })
      .finally(() => {
        const current = inFlightPersistBySheet.get(activeSheetId);
        if (current?.signature === signature) {
          inFlightPersistBySheet.delete(activeSheetId);
        }
      });
    inFlightPersistBySheet.set(activeSheetId, { signature, promise: persistPromise });
    await persistPromise;
  },

  renameSheet: async (token, sheetId, title) => {
    await saveSheet(token, sheetId, { title });
    set((state) => ({ sheets: updateSheetInCollection(state.sheets, sheetId, { title }) }));
  },

  setSheetVisibility: async (token, sheetId, isPublic) => {
    await saveSheet(token, sheetId, { isPublic });
    set((state) => ({ sheets: updateSheetInCollection(state.sheets, sheetId, { isPublic }) }));
  },

  setSheetArchived: async (token, sheetId, isArchived) => {
    await saveSheet(token, sheetId, { isArchived });
    set((state) => ({ sheets: updateSheetInCollection(state.sheets, sheetId, { isArchived }) }));
  },

  setSheetTitle: (title) => {
    set({ sheetTitle: title });
  },

  clearLimitWarning: () => set({ limitWarning: null }),

  addTopic: async (title) => {
    const currentTopics = get().topics;
    if (currentTopics.length >= MAX_TOPICS) {
      set({ limitWarning: `Limit reached: topic (${MAX_TOPICS})` });
      return null;
    }
    const updatedSheet = await createTopic({ topics: currentTopics }, title);
    set((state) => withHistory(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  editTopic: async (id, newTitle) => {
    const updatedSheet = await updateTopic({ topics: get().topics }, id, newTitle);
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  deleteTopic: async (id) => {
    const updatedSheet = await deleteTopic({ topics: get().topics }, id);
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  addSubTopic: async (topicId, subTitle) => {
    const currentTopics = get().topics;
    if (countSubTopics(currentTopics) >= MAX_SUBTOPICS) {
      set({ limitWarning: `Limit reached: subtopic (${MAX_SUBTOPICS})` });
      return null;
    }
    const updatedSheet = await createSubTopic({ topics: currentTopics }, topicId, subTitle);
    set((state) => withHistory(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  editSubTopic: async (topicId, subId, newTitle) => {
    const updatedSheet = await updateSubTopic({ topics: get().topics }, topicId, subId, newTitle);
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  deleteSubTopic: async (topicId, subId) => {
    const updatedSheet = await deleteSubTopic({ topics: get().topics }, topicId, subId);
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  addQuestion: async (topicId, subId, questionText) => {
    const currentTopics = get().topics;
    if (countQuestions(currentTopics) >= MAX_QUESTIONS) {
      set({ limitWarning: `Limit reached: question (${MAX_QUESTIONS})` });
      return null;
    }
    const updatedSheet = await createQuestion({ topics: currentTopics }, topicId, subId, questionText);
    set((state) => withHistory(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  editQuestion: async (topicId, subId, questionId, newText) => {
    const updatedSheet = await updateQuestion({ topics: get().topics }, topicId, subId, questionId, newText);
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  deleteQuestion: async (topicId, subId, questionId) => {
    const updatedSheet = await deleteQuestion({ topics: get().topics }, topicId, subId, questionId);
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  addLinkToQuestion: (topicId, subId, questionId, link) =>
    set((state) => {
      const topics = state.topics.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              subTopics: topic.subTopics.map((subTopic) =>
                subTopic.id !== subId
                  ? subTopic
                  : {
                      ...subTopic,
                      questions: subTopic.questions.map((question) =>
                        question.id !== questionId ? question : { ...question, link }
                      ),
                    }
              ),
            }
      );
      return withHistory(state, topics);
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previousTopics = state.past[state.past.length - 1];
      const nextPast = state.past.slice(0, -1);
      const nextFuture = [JSON.parse(JSON.stringify(state.topics)), ...state.future].slice(0, HISTORY_LIMIT);
      return { topics: previousTopics, past: nextPast, future: nextFuture };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const [nextTopics, ...remainingFuture] = state.future;
      const nextPast = [...state.past, JSON.parse(JSON.stringify(state.topics))].slice(-HISTORY_LIMIT);
      return { topics: nextTopics, past: nextPast, future: remainingFuture };
    }),

  reorderTopics: (startIndex, endIndex) =>
    set((state) => {
      const topics = reorderArray(state.topics, startIndex, endIndex);
      return withHistory(state, topics);
    }),

  moveSubTopic: (fromTopicId, toTopicId, startIndex, endIndex) =>
    set((state) => {
      const fromTopic = state.topics.find((topic) => topic.id === fromTopicId);
      const toTopic = state.topics.find((topic) => topic.id === toTopicId);
      if (!fromTopic || !toTopic) return state;
      const newFromSubTopics = Array.from(fromTopic.subTopics);
      const [movedSubTopic] = newFromSubTopics.splice(startIndex, 1);
      const newToSubTopics = fromTopicId === toTopicId ? newFromSubTopics : Array.from(toTopic.subTopics);
      newToSubTopics.splice(endIndex, 0, movedSubTopic);
      const topics = state.topics.map((topic) => {
        if (topic.id === fromTopicId) return { ...topic, subTopics: newFromSubTopics };
        if (topic.id === toTopicId) return { ...topic, subTopics: newToSubTopics };
        return topic;
      });
      return withHistory(state, topics);
    }),

  moveQuestion: (fromTopicId, fromSubId, toTopicId, toSubId, startIndex, endIndex) =>
    set((state) => {
      const fromTopic = state.topics.find((topic) => topic.id === fromTopicId);
      const toTopic = state.topics.find((topic) => topic.id === toTopicId);
      if (!fromTopic || !toTopic) return state;
      const fromSub = fromTopic.subTopics.find((sub) => sub.id === fromSubId);
      const toSub = toTopic.subTopics.find((sub) => sub.id === toSubId);
      if (!fromSub || !toSub) return state;
      if (fromTopicId === toTopicId && fromSubId === toSubId) {
        const newQuestions = reorderArray(fromSub.questions, startIndex, endIndex);
        const topics = state.topics.map((topic) =>
          topic.id === fromTopicId
            ? { ...topic, subTopics: topic.subTopics.map((subTopic) => (subTopic.id === fromSubId ? { ...subTopic, questions: newQuestions } : subTopic)) }
            : topic
        );
        return withHistory(state, topics);
      }
      const newFromQuestions = Array.from(fromSub.questions);
      const [movedQuestion] = newFromQuestions.splice(startIndex, 1);
      const newToQuestions = Array.from(toSub.questions);
      newToQuestions.splice(endIndex, 0, movedQuestion);
      const topics = state.topics.map((topic) => {
        if (topic.id === fromTopicId && fromTopicId === toTopicId) {
          return { ...topic, subTopics: topic.subTopics.map((subTopic) => {
            if (subTopic.id === fromSubId) return { ...subTopic, questions: newFromQuestions };
            if (subTopic.id === toSubId) return { ...subTopic, questions: newToQuestions };
            return subTopic;
          }) };
        }
        if (topic.id === fromTopicId) {
          return { ...topic, subTopics: topic.subTopics.map((subTopic) => (subTopic.id === fromSubId ? { ...subTopic, questions: newFromQuestions } : subTopic)) };
        }
        if (topic.id === toTopicId) {
          return { ...topic, subTopics: topic.subTopics.map((subTopic) => (subTopic.id === toSubId ? { ...subTopic, questions: newToQuestions } : subTopic)) };
        }
        return topic;
      });
      return withHistory(state, topics);
    }),

  toggleQuestionDone: (topicId, subId, questionId) =>
    set((state) => {
      const topics = state.topics.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              subTopics: topic.subTopics.map((subTopic) =>
                subTopic.id !== subId
                  ? subTopic
                  : {
                      ...subTopic,
                      questions: subTopic.questions.map((question) =>
                        question.id !== questionId
                          ? question
                          : { ...question, done: !question.done }
                      ),
                    }
              ),
            }
      );
      return withHistory(state, topics);
    }),

  updateQuestionAttempt: (topicId, subId, questionId, attemptLog) =>
    set((state) => {
      const topics = state.topics.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              subTopics: topic.subTopics.map((subTopic) =>
                subTopic.id !== subId
                  ? subTopic
                  : {
                      ...subTopic,
                      questions: subTopic.questions.map((question) =>
                        question.id !== questionId
                          ? question
                          : { ...question, done: true, attemptLog }
                      ),
                    }
              ),
            }
      );
      return withHistory(state, topics);
    }),

  setReadOnlySheet: (sheet) =>
    set({
      activeSheetId: null,
      topics: sheet.topics || [],
      sheetTitle: sheet.title || "Question Sheet",
      past: [],
      future: [],
    }),
}));
