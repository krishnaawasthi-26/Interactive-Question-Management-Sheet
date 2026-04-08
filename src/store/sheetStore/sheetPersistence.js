import { createSheet, getSheet, listSheets, removeSheet, saveSheet } from "../../api/sheetApi";
import { MAX_SHEETS } from "./constants";
import { buildSheetSignature, cloneDeep, computeDirtyState, updateSheetInCollection } from "./helpers";

// Persistence slice handles server IO, sheet metadata list updates, and save/discard semantics.
export const createSheetPersistenceSlice = ({ set, get }, internals) => ({
  loadSheets: async (token) => {
    const sheets = await listSheets(token);
    set({ sheets });
    return sheets;
  },

  createNewSheet: async (token, title) => {
    if (get().sheets.length >= MAX_SHEETS) {
      set({ limitWarning: `Limit reached: sheet (${MAX_SHEETS})` });
      return null;
    }
    const created = await createSheet(token, title);
    set((state) => ({ sheets: [...state.sheets, created], limitWarning: null }));
    return created;
  },

  deleteSheet: async (token, sheetId) => {
    await removeSheet(token, sheetId);
    set((state) => ({ sheets: state.sheets.filter((sheet) => sheet.id !== sheetId) }));
  },

  duplicateSheet: async (token, sourceSheet, customTitle) => {
    if (get().sheets.length >= MAX_SHEETS) {
      set({ limitWarning: `Limit reached: sheet (${MAX_SHEETS})` });
      return null;
    }

    const title = customTitle || `${sourceSheet.title || sourceSheet.name || "Untitled Sheet"} (Copy)`;
    const created = await createSheet(token, title);
    await saveSheet(token, created.id, {
      title,
      topics: sourceSheet.topics || [],
    });

    set((state) => ({
      sheets: [...state.sheets, { ...created, title, topics: sourceSheet.topics || [] }],
      limitWarning: null,
    }));

    return created;
  },

  duplicateSheetById: async (token, sheetId, customTitle) => {
    const sourceSheet = await getSheet(token, sheetId);
    return get().duplicateSheet(token, sourceSheet, customTitle);
  },

  setFullSheet: async (sheet) => {
    const normalized = {
      title: sheet.name || sheet.title || "Question Sheet",
      topics: sheet.topics || [],
    };
    set((state) => ({ ...state, sheetTitle: normalized.title, topics: normalized.topics, past: [], future: [] }));
    return normalized;
  },

  loadSheetById: async (token, sheetId) => {
    set({ isLoading: true, loadError: null });
    try {
      const sheet = await getSheet(token, sheetId);
      const title = sheet.title || "Question Sheet";
      const topics = sheet.topics || [];

      set({
        activeSheetId: sheet.id,
        topics,
        sheetTitle: title,
        lastSavedAt: sheet.updatedAt || new Date().toISOString(),
        isLoading: false,
        past: [],
        future: [],
        hasPendingChanges: false,
        saveError: null,
      });

      internals.lastPersistedSignatureBySheet.set(sheet.id, buildSheetSignature(title, topics));
      internals.lastSavedSheetStateById.set(sheet.id, { title, topics });
      return sheet;
    } catch (error) {
      set({ isLoading: false, loadError: error.message });
      return null;
    }
  },

  persistCurrentSheet: async (token) => {
    const { activeSheetId, topics, sheetTitle } = get();
    if (!activeSheetId) return;

    const signature = buildSheetSignature(sheetTitle, topics);
    if (internals.lastPersistedSignatureBySheet.get(activeSheetId) === signature) return;

    const inFlight = internals.inFlightPersistBySheet.get(activeSheetId);
    if (inFlight?.signature === signature) {
      await inFlight.promise;
      return;
    }

    const persistPromise = saveSheet(token, activeSheetId, { title: sheetTitle, topics })
      .then(() => {
        internals.lastPersistedSignatureBySheet.set(activeSheetId, signature);
      })
      .finally(() => {
        const current = internals.inFlightPersistBySheet.get(activeSheetId);
        if (current?.signature === signature) {
          internals.inFlightPersistBySheet.delete(activeSheetId);
        }
      });

    internals.inFlightPersistBySheet.set(activeSheetId, { signature, promise: persistPromise });
    await persistPromise;
  },

  saveCurrentSheetDraft: async (token) => {
    const { activeSheetId, topics, sheetTitle } = get();
    if (!activeSheetId) return false;

    set({ isSaving: true, saveError: null });
    try {
      await saveSheet(token, activeSheetId, { title: sheetTitle, topics });
      const signature = buildSheetSignature(sheetTitle, topics);
      internals.lastPersistedSignatureBySheet.set(activeSheetId, signature);
      internals.lastSavedSheetStateById.set(activeSheetId, { title: sheetTitle, topics: cloneDeep(topics) });
      set({ hasPendingChanges: false, isSaving: false, lastSavedAt: new Date().toISOString() });
      return true;
    } catch (error) {
      set({ isSaving: false, saveError: error.message || "Unable to save sheet changes." });
      return false;
    }
  },

  discardUnsavedChanges: () => {
    const { activeSheetId } = get();
    if (!activeSheetId) return;

    const savedState = internals.lastSavedSheetStateById.get(activeSheetId);
    if (!savedState) return;

    set({
      sheetTitle: savedState.title,
      topics: cloneDeep(savedState.topics),
      past: [],
      future: [],
      hasPendingChanges: false,
      saveError: null,
    });
  },

  renameSheet: async (token, sheetId, title) => {
    await saveSheet(token, sheetId, { title });
    set((state) => ({ sheets: updateSheetInCollection(state.sheets, sheetId, { title }) }));
  },

  setSheetVisibility: async (token, sheetId, isPublic) => {
    await saveSheet(token, sheetId, { isPublic });
    set((state) => ({ sheets: updateSheetInCollection(state.sheets, sheetId, { isPublic }) }));
  },

  setSheetArchived: async (token, sheetId, isArchived) => {
    await saveSheet(token, sheetId, { isArchived });
    set((state) => ({ sheets: updateSheetInCollection(state.sheets, sheetId, { isArchived }) }));
  },

  setSheetTitle: (title) =>
    set((state) => ({
      sheetTitle: title,
      hasPendingChanges: computeDirtyState({ ...state, sheetTitle: title }, internals.lastPersistedSignatureBySheet),
    })),

  setReadOnlySheet: (sheet) =>
    set({
      activeSheetId: null,
      topics: sheet.topics || [],
      sheetTitle: sheet.title || "Question Sheet",
      past: [],
      future: [],
      hasPendingChanges: false,
      saveError: null,
      lastSavedAt: null,
    }),
});
