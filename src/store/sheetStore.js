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
}));
