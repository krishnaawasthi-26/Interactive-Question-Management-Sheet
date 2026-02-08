import { create } from "zustand";

export const useSheetStore = create((set) => ({
  topics: [],

  setTopics: (topics) => set({ topics }),

  addTopic: (title) =>
    set((state) => ({
      topics: [
        ...state.topics,
        {
          id: Date.now(),
          title,
          subTopics: [],
        },
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

  // ----- SUBTOPICS -----
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

  // ----- QUESTIONS -----
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
                        { id: Date.now(), text: questionText },
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
}));
