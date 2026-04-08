import { reorderArray } from "./helpers";

// Reorder slice contains drag-and-drop reordering/move logic for topics/subtopics/questions.
export const createSheetReorderSlice = ({ set }, { applyTopicsWithHistoryAndDirty }) => ({
  reorderTopics: (startIndex, endIndex) =>
    set((state) => {
      const topics = reorderArray(state.topics, startIndex, endIndex);
      return applyTopicsWithHistoryAndDirty(state, topics);
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

      return applyTopicsWithHistoryAndDirty(state, topics);
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
                  subTopic.id === fromSubId ? { ...subTopic, questions: newQuestions } : subTopic
                ),
              }
            : topic
        );
        return applyTopicsWithHistoryAndDirty(state, topics);
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

      return applyTopicsWithHistoryAndDirty(state, topics);
    }),
});
