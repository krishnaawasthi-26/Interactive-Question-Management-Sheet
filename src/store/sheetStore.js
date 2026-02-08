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
}));
