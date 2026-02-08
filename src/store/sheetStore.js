import { create } from "zustand";

export const useSheetStore = create((set) => ({
  topics: [],

  // ----- Topics -----
  setTopics: (topics) => set({ topics }),
  addTopic: (title) =>
    set((state) => ({
      topics: [
        ...state.topics,
        { id: Date.now(), title, subTopics: [] },
      ],
    })),
  editTopic: (id, newTitle) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === id ? { ...t, title: newTitle } : t
      ),
    })),
  deleteTopic: (id) =>
    set((state) => ({
      topics: state.topics.filter((t) => t.id !== id),
    })),

  // ----- Subtopics -----
  addSubTopic: (topicId, subTitle) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              subTopics: [
                ...t.subTopics,
                { id: Date.now(), title: subTitle, questions: [] },
              ],
            }
          : t
      ),
    })),
  editSubTopic: (topicId, subId, newTitle) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              subTopics: t.subTopics.map((s) =>
                s.id === subId ? { ...s, title: newTitle } : s
              ),
            }
          : t
      ),
    })),
  deleteSubTopic: (topicId, subId) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? { ...t, subTopics: t.subTopics.filter((s) => s.id !== subId) }
          : t
      ),
    })),

  // ----- Questions -----
  addQuestion: (topicId, subId, questionText) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              subTopics: t.subTopics.map((s) =>
                s.id === subId
                  ? {
                      ...s,
                      questions: [
                        ...s.questions,
                        { id: Date.now(), text: questionText, link: "" },
                      ],
                    }
                  : s
              ),
            }
          : t
      ),
    })),
  editQuestion: (topicId, subId, questionId, newText) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              subTopics: t.subTopics.map((s) =>
                s.id === subId
                  ? {
                      ...s,
                      questions: s.questions.map((q) =>
                        q.id === questionId ? { ...q, text: newText } : q
                      ),
                    }
                  : s
              ),
            }
          : t
      ),
    })),
  deleteQuestion: (topicId, subId, questionId) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              subTopics: t.subTopics.map((s) =>
                s.id === subId
                  ? {
                      ...s,
                      questions: s.questions.filter((q) => q.id !== questionId),
                    }
                  : s
              ),
            }
          : t
      ),
    })),
  addLinkToQuestion: (topicId, subId, questionId, link) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              subTopics: t.subTopics.map((s) =>
                s.id === subId
                  ? {
                      ...s,
                      questions: s.questions.map((q) =>
                        q.id === questionId ? { ...q, link } : q
                      ),
                    }
                  : s
              ),
            }
          : t
      ),
    })),

  // ----- Drag & Drop -----
  reorderTopics: (startIndex, endIndex) =>
    set((state) => {
      const newTopics = Array.from(state.topics);
      const [removed] = newTopics.splice(startIndex, 1);
      newTopics.splice(endIndex, 0, removed);
      return { topics: newTopics };
    }),

  moveSubTopic: (fromTopicId, toTopicId, startIndex, endIndex) =>
    set((state) => {
      const fromTopic = state.topics.find(t => t.id === fromTopicId);
      const toTopic = state.topics.find(t => t.id === toTopicId);
      if (!fromTopic || !toTopic) return state;

      const newFromSub = Array.from(fromTopic.subTopics);
      const [movedSub] = newFromSub.splice(startIndex, 1);

      const newToSub = fromTopicId === toTopicId ? newFromSub : Array.from(toTopic.subTopics);
      newToSub.splice(endIndex, 0, movedSub);

      return {
        topics: state.topics.map(t => {
          if (t.id === fromTopicId) return { ...t, subTopics: newFromSub };
          if (t.id === toTopicId) return { ...t, subTopics: newToSub };
          return t;
        })
      };
    }),

  moveQuestion: (fromTopicId, fromSubId, toTopicId, toSubId, startIndex, endIndex) =>
  set((state) => {
    const fromTopic = state.topics.find(t => t.id === fromTopicId);
    const toTopic = state.topics.find(t => t.id === toTopicId);
    if (!fromTopic || !toTopic) return state;

    const fromSub = fromTopic.subTopics.find(s => s.id === fromSubId);
    const toSub = toTopic.subTopics.find(s => s.id === toSubId);
    if (!fromSub || !toSub) return state;

    // Same subtopic → reorder only
    if (fromTopicId === toTopicId && fromSubId === toSubId) {
      const newQs = Array.from(fromSub.questions);
      const [movedQ] = newQs.splice(startIndex, 1);
      newQs.splice(endIndex, 0, movedQ);

      return {
        topics: state.topics.map(t =>
          t.id === fromTopicId
            ? {
                ...t,
                subTopics: t.subTopics.map(s =>
                  s.id === fromSubId ? { ...s, questions: newQs } : s
                ),
              }
            : t
        ),
      };
    }

    // Different subtopic or different topic
    const newFromQs = Array.from(fromSub.questions);
    const [movedQ] = newFromQs.splice(startIndex, 1);
    const newToQs = Array.from(toSub.questions);
    newToQs.splice(endIndex, 0, movedQ);

    return {
      topics: state.topics.map(t => {
        if (t.id === fromTopicId && fromTopicId === toTopicId) {
          // Same topic, different subtopic
          return {
            ...t,
            subTopics: t.subTopics.map(s => {
              if (s.id === fromSubId) return { ...s, questions: newFromQs };
              if (s.id === toSubId) return { ...s, questions: newToQs };
              return s;
            }),
          };
        } else if (t.id === fromTopicId) {
          // Source topic
          return {
            ...t,
            subTopics: t.subTopics.map(s =>
              s.id === fromSubId ? { ...s, questions: newFromQs } : s
            ),
          };
        } else if (t.id === toTopicId) {
          // Destination topic
          return {
            ...t,
            subTopics: t.subTopics.map(s =>
              s.id === toSubId ? { ...s, questions: newToQs } : s
            ),
          };
        }
        return t;
      }),
    };
  }),




}));