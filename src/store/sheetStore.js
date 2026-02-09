import { create } from "zustand";
import {
  createTopic,
  createSubTopic,
  createQuestion,
  updateTopicById,
  updateSubTopicById,
  updateQuestionById,
  reorderArray,
} from "./sheetStore.helpers";

export const useSheetStore = create((set) => ({
  topics: [],

  // ----- Topics -----
  setTopics: (topics) => set({ topics }),
  addTopic: (title) =>
    set((state) => ({
      topics: [...state.topics, createTopic(title)],
    })),
  editTopic: (id, newTitle) =>
    set((state) => ({
      topics: updateTopicById(state.topics, id, (topic) => ({
        ...topic,
        title: newTitle,
      })),
    })),
  deleteTopic: (id) =>
    set((state) => ({
      topics: state.topics.filter((topic) => topic.id !== id),
    })),

  // ----- Subtopics -----
  addSubTopic: (topicId, subTitle) =>
    set((state) => ({
      topics: updateTopicById(state.topics, topicId, (topic) => ({
        ...topic,
        subTopics: [...topic.subTopics, createSubTopic(subTitle)],
      })),
    })),
  editSubTopic: (topicId, subId, newTitle) =>
    set((state) => ({
      topics: updateTopicById(state.topics, topicId, (topic) => ({
        ...topic,
        subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
          ...subTopic,
          title: newTitle,
        })),
      })),
    })),
  deleteSubTopic: (topicId, subId) =>
    set((state) => ({
      topics: updateTopicById(state.topics, topicId, (topic) => ({
        ...topic,
        subTopics: topic.subTopics.filter((subTopic) => subTopic.id !== subId),
      })),
    })),

  // ----- Questions -----
  addQuestion: (topicId, subId, questionText) =>
    set((state) => ({
      topics: updateTopicById(state.topics, topicId, (topic) => ({
        ...topic,
        subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
          ...subTopic,
          questions: [...subTopic.questions, createQuestion(questionText)],
        })),
      })),
    })),
  editQuestion: (topicId, subId, questionId, newText) =>
    set((state) => ({
      topics: updateTopicById(state.topics, topicId, (topic) => ({
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
    })),
  deleteQuestion: (topicId, subId, questionId) =>
    set((state) => ({
      topics: updateTopicById(state.topics, topicId, (topic) => ({
        ...topic,
        subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
          ...subTopic,
          questions: subTopic.questions.filter(
            (question) => question.id !== questionId
          ),
        })),
      })),
    })),
  addLinkToQuestion: (topicId, subId, questionId, link) =>
    set((state) => ({
      topics: updateTopicById(state.topics, topicId, (topic) => ({
        ...topic,
        subTopics: updateSubTopicById(topic.subTopics, subId, (subTopic) => ({
          ...subTopic,
          questions: updateQuestionById(
            subTopic.questions,
            questionId,
            (question) => ({ ...question, link })
          ),
        })),
      })),
    })),

  // ----- Drag & Drop -----
  reorderTopics: (startIndex, endIndex) =>
    set((state) => ({
      topics: reorderArray(state.topics, startIndex, endIndex),
    })),

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

      return {
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
      const fromTopic = state.topics.find(
        (topic) => topic.id === fromTopicId
      );
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

        return {
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
      }

      // Different subtopic or different topic
      const newFromQuestions = Array.from(fromSub.questions);
      const [movedQuestion] = newFromQuestions.splice(startIndex, 1);
      const newToQuestions = Array.from(toSub.questions);
      newToQuestions.splice(endIndex, 0, movedQuestion);

      return {
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
    }),
}));
