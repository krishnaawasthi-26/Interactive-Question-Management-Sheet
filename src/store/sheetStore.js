import { create } from "zustand";
import {
  createQuestion,
  createSubTopic,
  createTopic,
  deleteQuestion,
  deleteSubTopic,
  deleteTopic,
  fetchSheetBySlug,
  persistSheet,
  setSheet,
  updateQuestion,
  updateSubTopic,
  updateTopic,
} from "../api/questionSheetApi";

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
  topics: [],
  sheetTitle: "Question Sheet",
  isLoading: false,
  loadError: null,
  loadSource: "idle",
  past: [],
  future: [],

  setFullSheet: async (sheet) => {
    const saved = await setSheet({
      ...sheet,
      title: sheet.name || sheet.title || "Question Sheet",
      name: sheet.name || sheet.title || "Question Sheet",
      topics: sheet.topics || [],
    });

    set({
      topics: saved.topics || [],
      sheetTitle: saved.title || saved.name || "Question Sheet",
      past: [],
      future: [],
    });
    return saved;
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
    const updatedSheet = await updateSubTopic(
      { topics: get().topics },
      topicId,
      subId,
      newTitle
    );
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  deleteSubTopic: async (topicId, subId) => {
    const updatedSheet = await deleteSubTopic({ topics: get().topics }, topicId, subId);
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  addQuestion: async (topicId, subId, questionText) => {
    const updatedSheet = await createQuestion(
      { topics: get().topics },
      topicId,
      subId,
      questionText
    );
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  editQuestion: async (topicId, subId, questionId, newText) => {
    const updatedSheet = await updateQuestion(
      { topics: get().topics },
      topicId,
      subId,
      questionId,
      newText
    );
    set((state) => withHistory(state, updatedSheet.topics));
    return updatedSheet;
  },

  deleteQuestion: async (topicId, subId, questionId) => {
    const updatedSheet = await deleteQuestion(
      { topics: get().topics },
      topicId,
      subId,
      questionId
    );
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

      persistSheet({ topics });
      return withHistory(state, topics);
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previousTopics = state.past[state.past.length - 1];
      const nextPast = state.past.slice(0, -1);
      const nextFuture = [JSON.parse(JSON.stringify(state.topics)), ...state.future].slice(
        0,
        HISTORY_LIMIT
      );
      persistSheet({ topics: previousTopics, title: state.sheetTitle });
      return { topics: previousTopics, past: nextPast, future: nextFuture };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const [nextTopics, ...remainingFuture] = state.future;
      const nextPast = [...state.past, JSON.parse(JSON.stringify(state.topics))].slice(
        -HISTORY_LIMIT
      );
      persistSheet({ topics: nextTopics, title: state.sheetTitle });
      return { topics: nextTopics, past: nextPast, future: remainingFuture };
    }),

  reorderTopics: (startIndex, endIndex) =>
    set((state) => {
      const topics = reorderArray(state.topics, startIndex, endIndex);
      persistSheet({ topics, title: state.sheetTitle });
      return withHistory(state, topics);
    }),

  moveSubTopic: (fromTopicId, toTopicId, startIndex, endIndex) =>
    set((state) => {
      const fromTopic = state.topics.find((topic) => topic.id === fromTopicId);
      const toTopic = state.topics.find((topic) => topic.id === toTopicId);
      if (!fromTopic || !toTopic) return state;

      const newFromSubTopics = Array.from(fromTopic.subTopics);
      const [movedSubTopic] = newFromSubTopics.splice(startIndex, 1);
      const newToSubTopics =
        fromTopicId === toTopicId ? newFromSubTopics : Array.from(toTopic.subTopics);
      newToSubTopics.splice(endIndex, 0, movedSubTopic);

      const topics = state.topics.map((topic) => {
        if (topic.id === fromTopicId) return { ...topic, subTopics: newFromSubTopics };
        if (topic.id === toTopicId) return { ...topic, subTopics: newToSubTopics };
        return topic;
      });

      persistSheet({ topics, title: state.sheetTitle });
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
            ? {
                ...topic,
                subTopics: topic.subTopics.map((subTopic) =>
                  subTopic.id === fromSubId
                    ? { ...subTopic, questions: newQuestions }
                    : subTopic
                ),
              }
            : topic
        );
        persistSheet({ topics, title: state.sheetTitle });
        return withHistory(state, topics);
      }

      const newFromQuestions = Array.from(fromSub.questions);
      const [movedQuestion] = newFromQuestions.splice(startIndex, 1);
      const newToQuestions = Array.from(toSub.questions);
      newToQuestions.splice(endIndex, 0, movedQuestion);

      const topics = state.topics.map((topic) => {
        if (topic.id === fromTopicId && fromTopicId === toTopicId) {
          return {
            ...topic,
            subTopics: topic.subTopics.map((subTopic) => {
              if (subTopic.id === fromSubId) return { ...subTopic, questions: newFromQuestions };
              if (subTopic.id === toSubId) return { ...subTopic, questions: newToQuestions };
              return subTopic;
            }),
          };
        }
        if (topic.id === fromTopicId) {
          return {
            ...topic,
            subTopics: topic.subTopics.map((subTopic) =>
              subTopic.id === fromSubId ? { ...subTopic, questions: newFromQuestions } : subTopic
            ),
          };
        }
        if (topic.id === toTopicId) {
          return {
            ...topic,
            subTopics: topic.subTopics.map((subTopic) =>
              subTopic.id === toSubId ? { ...subTopic, questions: newToQuestions } : subTopic
            ),
          };
        }
        return topic;
      });

      persistSheet({ topics, title: state.sheetTitle });
      return withHistory(state, topics);
    }),

  fetchSheetBySlug: async (slug) => {
    set({ isLoading: true, loadError: null, loadSource: "idle" });
    try {
      const sheet = await fetchSheetBySlug(slug);
      if (sheet?.topics) {
        set({
          topics: sheet.topics,
          sheetTitle: sheet.title || sheet.name || "Question Sheet",
          past: [],
          future: [],
        });
      }

      set({
        loadSource: sheet?.source ?? "local",
        loadError: sheet?.hadRemoteError ? "Failed to load API, showing local data." : null,
      });
      return sheet;
    } catch (error) {
      set({
        loadError: error instanceof Error ? error.message : "Unable to load sheet data.",
        loadSource: "fallback",
      });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));
