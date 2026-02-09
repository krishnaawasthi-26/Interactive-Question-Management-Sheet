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
  updateQuestion,
  updateSubTopic,
  updateTopic,
} from "../api/questionSheetApi";

const updateTopicById = (topics, topicId, updater) =>
  topics.map((topic) => (topic.id === topicId ? updater(topic) : topic));

const updateSubTopicById = (subTopics, subId, updater) =>
  subTopics.map((subTopic) => (subTopic.id === subId ? updater(subTopic) : subTopic));

const updateQuestionById = (questions, questionId, updater) =>
  questions.map((question) =>
    question.id === questionId ? updater(question) : question
  );

const reorderArray = (items, startIndex, endIndex) => {
  const nextItems = Array.from(items);
  const [removed] = nextItems.splice(startIndex, 1);
  nextItems.splice(endIndex, 0, removed);
  return nextItems;
};
export const useSheetStore = create((set, get) => ({
  topics: [],
  isLoading: false,
  loadError: null,
  loadSource: "idle",
  lastDeleted: null,

  // ----- Topics -----
  setTopics: (topics) => set({ topics }),
  addTopic: async (title) => {
    const updatedSheet = await createTopic({ topics: get().topics }, title);
    set({ topics: updatedSheet.topics });
    return updatedSheet;
  },
  editTopic: async (id, newTitle) => {
    const updatedSheet = await updateTopic({ topics: get().topics }, id, newTitle);
    set({ topics: updatedSheet.topics });
    return updatedSheet;
  },
  deleteTopic: async (id) => {
    const topics = get().topics;
    const deletedIndex = topics.findIndex((topic) => topic.id === id);
    const deletedTopic = deletedIndex > -1 ? topics[deletedIndex] : null;
    const updatedSheet = await deleteTopic({ topics: get().topics }, id);
    // set({ topics: updatedSheet.topics });
    set({
      topics: updatedSheet.topics,
      lastDeleted: deletedTopic
        ? { type: "topic", item: deletedTopic, index: deletedIndex }
        : null,
    });
    return updatedSheet;
  },

  // ----- Subtopics -----
  addSubTopic: async (topicId, subTitle) => {
    const updatedSheet = await createSubTopic(
      { topics: get().topics },
      topicId,
      subTitle
    );
    set({ topics: updatedSheet.topics });
    return updatedSheet;
  },
  editSubTopic: async (topicId, subId, newTitle) => {
    const updatedSheet = await updateSubTopic(
      { topics: get().topics },
      topicId,
      subId,
      newTitle
    );
    // set({ topics: updatedSheet.topics });
    return updatedSheet;
  },
  deleteSubTopic: async (topicId, subId) => {
    const topics = get().topics;
    const parentTopic = topics.find((topic) => topic.id === topicId);
    const deletedIndex = parentTopic
      ? parentTopic.subTopics.findIndex((subTopic) => subTopic.id === subId)
      : -1;
    const deletedSubTopic =
      parentTopic && deletedIndex > -1 ? parentTopic.subTopics[deletedIndex] : null;
    const updatedSheet = await deleteSubTopic(
      { topics: get().topics },
      topicId,
      subId
    );
    set({ topics: updatedSheet.topics });
    set({
      topics: updatedSheet.topics,
      lastDeleted: deletedSubTopic
        ? {
            type: "subTopic",
            item: deletedSubTopic,
            topicId,
            index: deletedIndex,
          }
        : null,
    });
    return updatedSheet;
  },

  // ----- Questions -----
  addQuestion: async (topicId, subId, questionText) => {
    const updatedSheet = await createQuestion(
      { topics: get().topics },
      topicId,
      subId,
      questionText
    );
    set({ topics: updatedSheet.topics });
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
    set({ topics: updatedSheet.topics });
    return updatedSheet;
  },
  deleteQuestion: async (topicId, subId, questionId) => {
    const topics = get().topics;
    const parentTopic = topics.find((topic) => topic.id === topicId);
    const parentSubTopic = parentTopic?.subTopics.find((sub) => sub.id === subId);
    const deletedIndex = parentSubTopic
      ? parentSubTopic.questions.findIndex((question) => question.id === questionId)
      : -1;
    const deletedQuestion =
      parentSubTopic && deletedIndex > -1
        ? parentSubTopic.questions[deletedIndex]
        : null;
    const updatedSheet = await deleteQuestion(
      { topics: get().topics },
      topicId,
      subId,
      questionId
    );
    // set({ topics: updatedSheet.topics });
    set({
      topics: updatedSheet.topics,
      lastDeleted: deletedQuestion
        ? {
            type: "question",
            item: deletedQuestion,
            topicId,
            subId,
            index: deletedIndex,
          }
        : null,
    });
    return updatedSheet;
  },
  clearUndo: () => set({ lastDeleted: null }),
  undoDelete: () =>
    set((state) => {
      const { lastDeleted } = state;
      if (!lastDeleted) return state;
      if (lastDeleted.type === "topic") {
        const topics = Array.from(state.topics);
        const insertIndex = Math.min(lastDeleted.index, topics.length);
        topics.splice(insertIndex, 0, lastDeleted.item);
        persistSheet({ topics });
        return { topics, lastDeleted: null };
      }
      if (lastDeleted.type === "subTopic") {
        const topics = state.topics.map((topic) => {
          if (topic.id !== lastDeleted.topicId) return topic;
          const subTopics = Array.from(topic.subTopics);
          const insertIndex = Math.min(lastDeleted.index, subTopics.length);
          subTopics.splice(insertIndex, 0, lastDeleted.item);
          return { ...topic, subTopics };
        });
        persistSheet({ topics });
        return { topics, lastDeleted: null };
      }
      if (lastDeleted.type === "question") {
        const topics = state.topics.map((topic) => {
          if (topic.id !== lastDeleted.topicId) return topic;
          return {
            ...topic,
            subTopics: topic.subTopics.map((subTopic) => {
              if (subTopic.id !== lastDeleted.subId) return subTopic;
              const questions = Array.from(subTopic.questions);
              const insertIndex = Math.min(lastDeleted.index, questions.length);
              questions.splice(insertIndex, 0, lastDeleted.item);
              return { ...subTopic, questions };
            }),
          };
        });
        persistSheet({ topics });
        return { topics, lastDeleted: null };
      }
      return { ...state, lastDeleted: null };
    }),
  addLinkToQuestion: (topicId, subId, questionId, link) =>
    set((state) => {
      const topics = updateTopicById(state.topics, topicId, (topic) => ({
        ...topic,
        subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
          ...subTopic,
          questions: updateQuestionById(
            subTopic.questions,
            questionId,
            (question) => ({ ...question, link })
          ),
        })),
      }));
      persistSheet({ topics });
      return { topics };
    }),

  // ----- Drag & Drop -----
  reorderTopics: (startIndex, endIndex) =>
    set((state) => {
      const topics = reorderArray(state.topics, startIndex, endIndex);
      persistSheet({ topics });
      return { topics };
    }),

  moveSubTopic: (fromTopicId, toTopicId, startIndex, endIndex) =>
    set((state) => {
      const fromTopic = state.topics.find((topic) => topic.id === fromTopicId);
      const toTopic = state.topics.find((topic) => topic.id === toTopicId);
      if (!fromTopic || !toTopic) return state;

      const newFromSubTopics = Array.from(fromTopic.subTopics);
      const [movedSubTopic] = newFromSubTopics.splice(startIndex, 1);

      const newToSubTopics =
        fromTopicId === toTopicId
          ? newFromSubTopics
          : Array.from(toTopic.subTopics);
      newToSubTopics.splice(endIndex, 0, movedSubTopic);

      const updatedState = {
        topics: state.topics.map((topic) => {
          if (topic.id === fromTopicId) {
            return { ...topic, subTopics: newFromSubTopics };
          }
          if (topic.id === toTopicId) {
            return { ...topic, subTopics: newToSubTopics };
          }
          return topic;
        }),
      };
      persistSheet({ topics: updatedState.topics });
      return updatedState;
    }),

  moveQuestion: (
    fromTopicId,
    fromSubId,
    toTopicId,
    toSubId,
    startIndex,
    endIndex
  ) =>
    set((state) => {
      const fromTopic = state.topics.find((topic) => topic.id === fromTopicId);
      const toTopic = state.topics.find((topic) => topic.id === toTopicId);
      if (!fromTopic || !toTopic) return state;

      const fromSub = fromTopic.subTopics.find((sub) => sub.id === fromSubId);
      const toSub = toTopic.subTopics.find((sub) => sub.id === toSubId);
      if (!fromSub || !toSub) return state;

      // Same subtopic → reorder only
      if (fromTopicId === toTopicId && fromSubId === toSubId) {
        const newQuestions = reorderArray(
          fromSub.questions,
          startIndex,
          endIndex
        );

        const updatedState = {
          topics: state.topics.map((topic) =>
            topic.id === fromTopicId
              ? {
                  ...topic,
                  subTopics: updateSubTopicById(
                    topic.subTopics,
                    fromSubId,
                    (subTopic) => ({ ...subTopic, questions: newQuestions })
                  ),
                }
              : topic
          ),
        };
        persistSheet({ topics: updatedState.topics });
        return updatedState;
      }

      // Different subtopic or different topic
      const newFromQuestions = Array.from(fromSub.questions);
      const [movedQuestion] = newFromQuestions.splice(startIndex, 1);
      const newToQuestions = Array.from(toSub.questions);
      newToQuestions.splice(endIndex, 0, movedQuestion);

      const updatedState = {
        topics: state.topics.map((topic) => {
          if (topic.id === fromTopicId && fromTopicId === toTopicId) {
            // Same topic, different subtopic
            return {
              ...topic,
              subTopics: topic.subTopics.map((subTopic) => {
                if (subTopic.id === fromSubId) {
                  return { ...subTopic, questions: newFromQuestions };
                }
                if (subTopic.id === toSubId) {
                  return { ...subTopic, questions: newToQuestions };
                }
                return subTopic;
              }),
            };
          }
          if (topic.id === fromTopicId) {
            // Source topic
            return {
              ...topic,
              subTopics: updateSubTopicById(
                topic.subTopics,
                fromSubId,
                (subTopic) => ({ ...subTopic, questions: newFromQuestions })
              ),
            };
          }
          if (topic.id === toTopicId) {
            // Destination topic
            return {
              ...topic,
              subTopics: updateSubTopicById(
                topic.subTopics,
                toSubId,
                (subTopic) => ({ ...subTopic, questions: newToQuestions })
              ),
            };
          }
          return topic;
        }),
      };
      persistSheet({ topics: updatedState.topics });
      return updatedState;
    }),

  // ----- API -----

fetchSheetBySlug: async (slug) => {
    // const sheet = await fetchSheetBySlug(slug);
    // if (sheet?.topics) {
    //   set({ topics: sheet.topics });
    set({ isLoading: true, loadError: null, loadSource: "idle" });
    try {
      const sheet = await fetchSheetBySlug(slug);
      if (sheet?.topics) {
        set({ topics: sheet.topics });
      }
      set({
        loadSource: sheet?.source ?? "local",
        loadError: sheet?.hadRemoteError
          ? "Failed to load API, showing local data."
          : null,
      });
      return sheet;
    } catch (error) {
      set({
        loadError:
          error instanceof Error ? error.message : "Unable to load sheet data.",
        loadSource: "fallback",
      });
      return null;
    } finally {
      set({ isLoading: false });
    }
    // return sheet;
  },
// }));
}));