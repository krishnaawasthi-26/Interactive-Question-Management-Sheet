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

  loadSheets: async (token) => {
    const sheets = await listSheets(token);
    set({ sheets });
    return sheets;
  },

  createNewSheet: async (token, title) => {
    const created = await createSheet(token, title);
    const sheets = await listSheets(token);
    set({ sheets });
    return created;
  },

  deleteSheet: async (token, sheetId) => {
    await removeSheet(token, sheetId);
    const sheets = await listSheets(token);
    set({ sheets });
  },


  duplicateSheet: async (token, sourceSheet, customTitle) => {
    const created = await createSheet(token, customTitle || `${sourceSheet.title || sourceSheet.name || "Untitled Sheet"} (Copy)`);
    await saveSheet(token, created.id, {
      title: customTitle || `${sourceSheet.title || sourceSheet.name || "Untitled Sheet"} (Copy)`,
      topics: sourceSheet.topics || [],
    });
    const sheets = await listSheets(token);
    set({ sheets });
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
      return sheet;
    } catch (error) {
      set({ isLoading: false, loadError: error.message });
      return null;
    }
  },

  persistCurrentSheet: async (token) => {
    const { activeSheetId, topics, sheetTitle } = get();
    if (!activeSheetId) return;
    await saveSheet(token, activeSheetId, { title: sheetTitle, topics });
  },

  renameSheet: async (token, sheetId, title) => {
    await saveSheet(token, sheetId, { title });
    const sheets = await listSheets(token);
    set({ sheets });
  },

  setSheetTitle: (title) => {
    set({ sheetTitle: title });
  },

  addTopic: async (title) => {
    const updatedSheet = await createTopic({ topics: get().topics }, title);
    set((state) => withHistory(state, updatedSheet.topics));
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
    const updatedSheet = await createSubTopic({ topics: get().topics }, topicId, subTitle);
    set((state) => withHistory(state, updatedSheet.topics));
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
    const updatedSheet = await createQuestion({ topics: get().topics }, topicId, subId, questionText);
    set((state) => withHistory(state, updatedSheet.topics));
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

  setReadOnlySheet: (sheet) =>
    set({
      activeSheetId: null,
      topics: sheet.topics || [],
      sheetTitle: sheet.title || "Question Sheet",
      past: [],
      future: [],
    }),
}));
