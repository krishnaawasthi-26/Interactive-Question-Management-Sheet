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
} from "../../api/questionSheetApi";
import { MAX_QUESTIONS, MAX_SUBTOPICS, MAX_TOPICS } from "./constants";
import { countQuestions, countSubTopics } from "./helpers";
import { updateQuestionById } from "./sheetSelectors";

// CRUD slice owns topic/subtopic/question changes and applies history + dirty tracking.
export const createSheetCrudSlice = ({ set, get }, { applyTopicsWithHistoryAndDirty }) => ({
  clearLimitWarning: () => set({ limitWarning: null }),

  addTopic: async (title) => {
    const currentTopics = get().topics;
    if (currentTopics.length >= MAX_TOPICS) {
      set({ limitWarning: `Limit reached: topic (${MAX_TOPICS})` });
      return null;
    }

    const updatedSheet = await createTopic({ topics: currentTopics }, title);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  editTopic: async (id, newTitle) => {
    const updatedSheet = await updateTopic({ topics: get().topics }, id, newTitle);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    return updatedSheet;
  },

  deleteTopic: async (id) => {
    const updatedSheet = await deleteTopic({ topics: get().topics }, id);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    return updatedSheet;
  },

  addSubTopic: async (topicId, subTitle) => {
    const currentTopics = get().topics;
    if (countSubTopics(currentTopics) >= MAX_SUBTOPICS) {
      set({ limitWarning: `Limit reached: subtopic (${MAX_SUBTOPICS})` });
      return null;
    }

    const updatedSheet = await createSubTopic({ topics: currentTopics }, topicId, subTitle);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  editSubTopic: async (topicId, subId, newTitle) => {
    const updatedSheet = await updateSubTopic({ topics: get().topics }, topicId, subId, newTitle);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    return updatedSheet;
  },

  deleteSubTopic: async (topicId, subId) => {
    const updatedSheet = await deleteSubTopic({ topics: get().topics }, topicId, subId);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    return updatedSheet;
  },

  addQuestion: async (topicId, subId, questionText) => {
    const currentTopics = get().topics;
    if (countQuestions(currentTopics) >= MAX_QUESTIONS) {
      set({ limitWarning: `Limit reached: question (${MAX_QUESTIONS})` });
      return null;
    }

    const updatedSheet = await createQuestion({ topics: currentTopics }, topicId, subId, questionText);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  editQuestion: async (topicId, subId, questionId, newText) => {
    const updatedSheet = await updateQuestion({ topics: get().topics }, topicId, subId, questionId, newText);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    return updatedSheet;
  },

  deleteQuestion: async (topicId, subId, questionId) => {
    const updatedSheet = await deleteQuestion({ topics: get().topics }, topicId, subId, questionId);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    return updatedSheet;
  },

  addLinkToQuestion: (topicId, subId, questionId, link) =>
    set((state) => {
      const topics = updateQuestionById(state.topics, topicId, subId, questionId, (question) => ({
        ...question,
        link,
      }));
      return applyTopicsWithHistoryAndDirty(state, topics);
    }),

  updateQuestionResources: (topicId, subId, questionId, resources) =>
    set((state) => {
      const topics = updateQuestionById(state.topics, topicId, subId, questionId, (question) => ({
        ...question,
        ...resources,
      }));
      return applyTopicsWithHistoryAndDirty(state, topics);
    }),

  toggleQuestionDone: (topicId, subId, questionId) =>
    set((state) => {
      const topics = updateQuestionById(state.topics, topicId, subId, questionId, (question) => ({
        ...question,
        done: !question.done,
      }));
      return applyTopicsWithHistoryAndDirty(state, topics);
    }),

  updateQuestionAttempt: (topicId, subId, questionId, attemptLog) =>
    set((state) => {
      const topics = updateQuestionById(state.topics, topicId, subId, questionId, (question) => ({
        ...question,
        done: true,
        attemptLog,
      }));
      return applyTopicsWithHistoryAndDirty(state, topics);
    }),
});
