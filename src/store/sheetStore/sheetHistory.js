import { HISTORY_LIMIT } from "./constants";
import { applyTopicsWithHistoryAndDirty, cloneDeep, computeDirtyState } from "./helpers";

// History slice handles undo/redo stacks and reusable "withHistory" transitions.
export const createSheetHistorySlice = ({ set }, { lastPersistedSignatureBySheet }) => {
  const withHistory = (state, nextTopics) => {
    const snapshot = cloneDeep(state.topics);
    const nextPast = [...state.past, snapshot].slice(-HISTORY_LIMIT);
    return { topics: nextTopics, past: nextPast, future: [] };
  };

  return {
    withHistory,
    undo: () =>
      set((state) => {
        if (state.past.length === 0) return state;
        const previousTopics = state.past[state.past.length - 1];
        const nextPast = state.past.slice(0, -1);
        const nextFuture = [cloneDeep(state.topics), ...state.future].slice(0, HISTORY_LIMIT);
        return {
          topics: previousTopics,
          past: nextPast,
          future: nextFuture,
          hasPendingChanges: computeDirtyState(
            { ...state, topics: previousTopics },
            lastPersistedSignatureBySheet
          ),
        };
      }),

    redo: () =>
      set((state) => {
        if (state.future.length === 0) return state;
        const [nextTopics, ...remainingFuture] = state.future;
        const nextPast = [...state.past, cloneDeep(state.topics)].slice(-HISTORY_LIMIT);
        return {
          topics: nextTopics,
          past: nextPast,
          future: remainingFuture,
          hasPendingChanges: computeDirtyState(
            { ...state, topics: nextTopics },
            lastPersistedSignatureBySheet
          ),
        };
      }),

    applyTopicsWithHistoryAndDirty: (state, nextTopics) =>
      applyTopicsWithHistoryAndDirty(state, nextTopics, withHistory, lastPersistedSignatureBySheet),
  };
};
