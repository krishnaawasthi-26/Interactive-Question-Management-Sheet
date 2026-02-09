import { create } from "zustand";
import {
  clearLocalSheet,
  fetchSheetBySlug,
  persistSheet,
} from "../api/questionSheetApi";

const createTopic = (title) => ({
  id: Date.now(),
  title,
  subTopics: [],
});

const createSubTopic = (title) => ({
  id: Date.now(),
  title,
  questions: [],
});

const createQuestion = (text) => ({
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

const reorderArray = (items, startIndex, endIndex) => {
  const nextItems = Array.from(items);
  const [removed] = nextItems.splice(startIndex, 1);
  nextItems.splice(endIndex, 0, removed);
  return nextItems;
};

export const useSheetStore = create((set, get) => {
  const persistTopics = (topics) => {
    persistSheet({ slug: get().slug, topics });
  };

  return {
    topics: [],
    slug: null,

    // ----- Topics -----
    setTopics: (topics) => set({ topics }),
    addTopic: (title) =>
      set((state) => {
        const topics = [...state.topics, createTopic(title)];
        persistTopics(topics);
        return { topics };
      }),
    editTopic: (id, newTitle) =>
      set((state) => {
        const topics = updateTopicById(state.topics, id, (topic) => ({
          ...topic,
          title: newTitle,
        }));
        persistTopics(topics);
        return { topics };
      }),
    deleteTopic: (id) =>
      set((state) => {
        const topics = state.topics.filter((topic) => topic.id !== id);
        persistTopics(topics);
        return { topics };
      }),

    // ----- Subtopics -----
    addSubTopic: (topicId, subTitle) =>
      set((state) => {
        const topics = updateTopicById(state.topics, topicId, (topic) => ({
          ...topic,
          subTopics: [...topic.subTopics, createSubTopic(subTitle)],
        }));
        persistTopics(topics);
        return { topics };
      }),
    editSubTopic: (topicId, subId, newTitle) =>
      set((state) => {
        const topics = updateTopicById(state.topics, topicId, (topic) => ({
          ...topic,
          subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
            ...subTopic,
            title: newTitle,
          })),
        }));
        persistTopics(topics);
        return { topics };
      }),
    deleteSubTopic: (topicId, subId) =>
      set((state) => {
        const topics = updateTopicById(state.topics, topicId, (topic) => ({
          ...topic,
          subTopics: topic.subTopics.filter((subTopic) => subTopic.id !== subId),
        }));
        persistTopics(topics);
        return { topics };
      }),

    // ----- Questions -----
    addQuestion: (topicId, subId, questionText) =>
      set((state) => {
        const topics = updateTopicById(state.topics, topicId, (topic) => ({
          ...topic,
          subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
            ...subTopic,
            questions: [...subTopic.questions, createQuestion(questionText)],
          })),
        }));
        persistTopics(topics);
        return { topics };
      }),
    editQuestion: (topicId, subId, questionId, newText) =>
      set((state) => {
        const topics = updateTopicById(state.topics, topicId, (topic) => ({
          ...topic,
          subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
            ...subTopic,
            questions: updateQuestionById(
              subTopic.questions,
              questionId,
              (question) => ({ ...question, text: newText })
            ),
          })),
        }));
        persistTopics(topics);
        return { topics };
      }),
    deleteQuestion: (topicId, subId, questionId) =>
      set((state) => {
        const topics = updateTopicById(state.topics, topicId, (topic) => ({
          ...topic,
          subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
            ...subTopic,
            questions: subTopic.questions.filter(
              (question) => question.id !== questionId
            ),
          })),
        }));
        persistTopics(topics);
        return { topics };
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
        persistTopics(topics);
        return { topics };
      }),

    // ----- Drag & Drop -----
    reorderTopics: (startIndex, endIndex) =>
      set((state) => {
        const topics = reorderArray(state.topics, startIndex, endIndex);
        persistTopics(topics);
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
        persistTopics(updatedState.topics);
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
          persistTopics(updatedState.topics);
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
        persistTopics(updatedState.topics);
        return updatedState;
      }),

    // ----- API -----
    fetchSheetBySlug: async (slug) => {
      const sheet = await fetchSheetBySlug(slug);
      if (sheet?.topics) {
        set({ topics: sheet.topics, slug: sheet.slug ?? slug });
      }
      return sheet;
    },
    resetSheet: async (slug) => {
      clearLocalSheet(slug);
      const sheet = await fetchSheetBySlug(slug, { forceRefresh: true });
      if (sheet?.topics) {
        set({ topics: sheet.topics, slug: sheet.slug ?? slug });
      }
      return sheet;
    },
  };
});
