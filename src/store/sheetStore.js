import { create } from "zustand";
import { createSheetCrudSlice } from "./sheetStore/sheetCrud";
import { createSheetHistorySlice } from "./sheetStore/sheetHistory";
import { createSheetPersistenceSlice } from "./sheetStore/sheetPersistence";
import { createSheetReorderSlice } from "./sheetStore/sheetReorder";

const initialState = {
  sheets: [],
  activeSheetId: null,
  topics: [],
  sheetTitle: "Question Sheet",
  isLoading: false,
  loadError: null,
  loadSource: "idle",
  past: [],
  future: [],
  limitWarning: null,
  hasPendingChanges: false,
  isSaving: false,
  saveError: null,
  lastSavedAt: null,
};

// Composition root: wire all focused modules into a single public Zustand store API.
export const useSheetStore = create((set, get) => {
  const internals = {
    lastPersistedSignatureBySheet: new Map(),
    inFlightPersistBySheet: new Map(),
    lastSavedSheetStateById: new Map(),
  };

  const historySlice = createSheetHistorySlice({ set, get }, internals);

  return {
    ...initialState,
    resetSheetState: () => {
      internals.lastPersistedSignatureBySheet.clear();
      internals.inFlightPersistBySheet.clear();
      internals.lastSavedSheetStateById.clear();
      set({ ...initialState });
    },
    ...createSheetPersistenceSlice({ set, get }, internals),
    ...createSheetCrudSlice({ set, get }, historySlice),
    ...createSheetReorderSlice({ set, get }, historySlice),
    undo: historySlice.undo,
    redo: historySlice.redo,
  };
});
