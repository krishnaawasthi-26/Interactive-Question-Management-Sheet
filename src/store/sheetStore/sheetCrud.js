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
} from "../../api/questionSheet";
import { useAuthStore } from "../authStore";
import { isPremiumActive } from "../../services/premium";
import { FREE_LIMITS, MAX_WORDS_PER_ENTRY, PREMIUM_LIMITS } from "./constants";
import { countQuestions, countSubTopics } from "./helpers";
import { updateQuestionById } from "./sheetSelectors";

const getPlanLimits = () => {
  const currentUser = useAuthStore.getState().currentUser;
  return isPremiumActive(currentUser) ? PREMIUM_LIMITS : FREE_LIMITS;
};

const countWords = (value) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const exceedsWordLimit = (value) => countWords(value) > MAX_WORDS_PER_ENTRY;

const getFreeEditLockOverflowType = (topics = []) => {
  if (topics.length > FREE_LIMITS.topics) return "topics";
  if (countSubTopics(topics) > FREE_LIMITS.subTopics) return "subtopics";
  if (countQuestions(topics) > FREE_LIMITS.questions) return "questions";
  return null;
};

// CRUD slice owns topic/subtopic/question changes and applies history + dirty tracking.
export const createSheetCrudSlice = ({ set, get }, { applyTopicsWithHistoryAndDirty }) => ({
  clearLimitWarning: () => set({ limitWarning: null }),

  addTopic: async (title) => {
    const currentTopics = get().topics;
    const currentUser = useAuthStore.getState().currentUser;
    const editOverflowType = isPremiumActive(currentUser) ? null : getFreeEditLockOverflowType(currentTopics);
    if (editOverflowType) {
      set({ limitWarning: `Limit reached: edit-lock (${editOverflowType})` });
      return null;
    }
    const limits = getPlanLimits();
    if (currentTopics.length >= limits.topics) {
      set({ limitWarning: `Limit reached: topic (${limits.topics})` });
      return null;
    }

    if (exceedsWordLimit(title)) {
      set({ limitWarning: `Topic title can have at most ${MAX_WORDS_PER_ENTRY} words.` });
      return null;
    }

    const updatedSheet = await createTopic({ topics: currentTopics }, title);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  editTopic: async (id, newTitle) => {
    const currentTopics = get().topics;
    const currentUser = useAuthStore.getState().currentUser;
    const editOverflowType = isPremiumActive(currentUser) ? null : getFreeEditLockOverflowType(currentTopics);
    if (editOverflowType) {
      set({ limitWarning: `Limit reached: edit-lock (${editOverflowType})` });
      return null;
    }

    if (exceedsWordLimit(newTitle)) {
      set({ limitWarning: `Topic title can have at most ${MAX_WORDS_PER_ENTRY} words.` });
      return null;
    }

    const updatedSheet = await updateTopic({ topics: get().topics }, id, newTitle);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  deleteTopic: async (id) => {
    const currentTopics = get().topics;
    const currentUser = useAuthStore.getState().currentUser;
    const editOverflowType = isPremiumActive(currentUser) ? null : getFreeEditLockOverflowType(currentTopics);
    if (editOverflowType) {
      set({ limitWarning: `Limit reached: edit-lock (${editOverflowType})` });
      return null;
    }
    const updatedSheet = await deleteTopic({ topics: get().topics }, id);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    return updatedSheet;
  },

  addSubTopic: async (topicId, subTitle) => {
    const currentTopics = get().topics;
    const currentUser = useAuthStore.getState().currentUser;
    const editOverflowType = isPremiumActive(currentUser) ? null : getFreeEditLockOverflowType(currentTopics);
    if (editOverflowType) {
      set({ limitWarning: `Limit reached: edit-lock (${editOverflowType})` });
      return null;
    }
    const limits = getPlanLimits();
    if (countSubTopics(currentTopics) >= limits.subTopics) {
      set({ limitWarning: `Limit reached: subtopic (${limits.subTopics})` });
      return null;
    }

    if (exceedsWordLimit(subTitle)) {
      set({ limitWarning: `Subtopic title can have at most ${MAX_WORDS_PER_ENTRY} words.` });
      return null;
    }

    const updatedSheet = await createSubTopic({ topics: currentTopics }, topicId, subTitle);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  editSubTopic: async (topicId, subId, newTitle) => {
    const currentTopics = get().topics;
    const currentUser = useAuthStore.getState().currentUser;
    const editOverflowType = isPremiumActive(currentUser) ? null : getFreeEditLockOverflowType(currentTopics);
    if (editOverflowType) {
      set({ limitWarning: `Limit reached: edit-lock (${editOverflowType})` });
      return null;
    }

    if (exceedsWordLimit(newTitle)) {
      set({ limitWarning: `Subtopic title can have at most ${MAX_WORDS_PER_ENTRY} words.` });
      return null;
    }

    const updatedSheet = await updateSubTopic({ topics: get().topics }, topicId, subId, newTitle);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  deleteSubTopic: async (topicId, subId) => {
    const currentTopics = get().topics;
    const currentUser = useAuthStore.getState().currentUser;
    const editOverflowType = isPremiumActive(currentUser) ? null : getFreeEditLockOverflowType(currentTopics);
    if (editOverflowType) {
      set({ limitWarning: `Limit reached: edit-lock (${editOverflowType})` });
      return null;
    }
    const updatedSheet = await deleteSubTopic({ topics: get().topics }, topicId, subId);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    return updatedSheet;
  },

  addQuestion: async (topicId, subId, questionText) => {
    const currentTopics = get().topics;
    const currentUser = useAuthStore.getState().currentUser;
    const editOverflowType = isPremiumActive(currentUser) ? null : getFreeEditLockOverflowType(currentTopics);
    if (editOverflowType) {
      set({ limitWarning: `Limit reached: edit-lock (${editOverflowType})` });
      return null;
    }
    const limits = getPlanLimits();
    if (countQuestions(currentTopics) >= limits.questions) {
      set({ limitWarning: `Limit reached: question (${limits.questions})` });
      return null;
    }

    if (exceedsWordLimit(questionText)) {
      set({ limitWarning: `Question text can have at most ${MAX_WORDS_PER_ENTRY} words.` });
      return null;
    }

    const updatedSheet = await createQuestion({ topics: currentTopics }, topicId, subId, questionText);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  editQuestion: async (topicId, subId, questionId, newText) => {
    const currentTopics = get().topics;
    const currentUser = useAuthStore.getState().currentUser;
    const editOverflowType = isPremiumActive(currentUser) ? null : getFreeEditLockOverflowType(currentTopics);
    if (editOverflowType) {
      set({ limitWarning: `Limit reached: edit-lock (${editOverflowType})` });
      return null;
    }

    if (exceedsWordLimit(newText)) {
      set({ limitWarning: `Question text can have at most ${MAX_WORDS_PER_ENTRY} words.` });
      return null;
    }

    const updatedSheet = await updateQuestion({ topics: get().topics }, topicId, subId, questionId, newText);
    set((state) => applyTopicsWithHistoryAndDirty(state, updatedSheet.topics));
    set({ limitWarning: null });
    return updatedSheet;
  },

  deleteQuestion: async (topicId, subId, questionId) => {
    const currentTopics = get().topics;
    const currentUser = useAuthStore.getState().currentUser;
    const editOverflowType = isPremiumActive(currentUser) ? null : getFreeEditLockOverflowType(currentTopics);
    if (editOverflowType) {
      set({ limitWarning: `Limit reached: edit-lock (${editOverflowType})` });
      return null;
    }
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
