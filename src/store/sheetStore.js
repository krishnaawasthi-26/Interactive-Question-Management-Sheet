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

  reorderSubTopics: (topicId, startIndex, endIndex) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              subTopics: (() => {
                const newSub = Array.from(t.subTopics);
                const [removed] = newSub.splice(startIndex, 1);
                newSub.splice(endIndex, 0, removed);
                return newSub;
              })(),
            }
          : t
      ),
    })),

  reorderQuestions: (topicId, subId, startIndex, endIndex) =>
    set((state) => ({
      topics: state.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              subTopics: t.subTopics.map((s) =>
                s.id === subId
                  ? (() => {
                      const newQs = Array.from(s.questions);
                      const [removed] = newQs.splice(startIndex, 1);
                      newQs.splice(endIndex, 0, removed);
                      return { ...s, questions: newQs };
                    })()
                  : s
              ),
            }
          : t
      ),
    })),
}));
