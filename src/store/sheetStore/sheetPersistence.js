import { createSheet, getSheet, listSheets, removeSheet, saveSheet } from "../../api/sheetApi";
import { useAuthStore } from "../authStore";
import { isPremiumActive } from "../../services/premium";
import { FREE_COPY_EXEMPT_SOURCE_SHEET_IDS, FREE_LIMITS, PREMIUM_LIMITS } from "./constants";
import {
  buildSheetSignature,
  cloneDeep,
  countQuestions,
  countSubTopics,
  computeDirtyState,
  normalizeSheetVisibility,
  updateSheetInCollection,
} from "./helpers";

const buildSafeSheetUpdatePayload = async ({
  token,
  sheetId,
  getState,
  overrideFields = {},
  includeContent = true,
}) => {
  const state = getState();
  const listedSheet = state.sheets.find((sheet) => sheet.id === sheetId);
  const activeSheetData = state.activeSheetId === sheetId
    ? { title: state.sheetTitle, topics: state.topics }
    : null;

  const fallbackSheet = listedSheet || (await getSheet(token, sheetId));
  const fallbackTitle = fallbackSheet?.title || "Untitled Sheet";
  const fallbackTopics = fallbackSheet?.topics || [];

  const payload = { ...overrideFields };

  if (includeContent) {
    payload.title = activeSheetData?.title ?? fallbackTitle;
    payload.topics = activeSheetData?.topics ?? fallbackTopics;
  }

  return payload;
};

const getFreeLimitOverflowType = (topics = []) => {
  const topicCount = Array.isArray(topics) ? topics.length : 0;
  if (topicCount > FREE_LIMITS.topics) return "topics";
  if (countSubTopics(topics) > FREE_LIMITS.subTopics) return "subtopics";
  if (countQuestions(topics) > FREE_LIMITS.questions) return "questions";
  return null;
};

// Persistence slice handles server IO, sheet metadata list updates, and save/discard semantics.
export const createSheetPersistenceSlice = ({ set, get }, internals) => ({
  getSheetLimit: () => {
    const currentUser = useAuthStore.getState().currentUser;
    const limits = isPremiumActive(currentUser) ? PREMIUM_LIMITS : FREE_LIMITS;
    return limits.sheets;
  },

  loadSheets: async (token) => {
    const sheets = (await listSheets(token)).map(normalizeSheetVisibility);
    set({ sheets });
    return sheets;
  },

  createNewSheet: async (token, title) => {
    const sheetLimit = get().getSheetLimit();
    if (get().sheets.length >= sheetLimit) {
      set({ limitWarning: `Limit reached: sheet (${sheetLimit})` });
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
    const sheetLimit = get().getSheetLimit();
    if (get().sheets.length >= sheetLimit) {
      set({ limitWarning: `Limit reached: sheet (${sheetLimit})` });
      return null;
    }

    const currentUser = useAuthStore.getState().currentUser;
    const hasPremium = isPremiumActive(currentUser);
    const sourceSheetId = sourceSheet?.id;
    const isCuratedExemptSource = FREE_COPY_EXEMPT_SOURCE_SHEET_IDS.has(sourceSheetId);
    const overflowType = getFreeLimitOverflowType(sourceSheet?.topics || []);

    if (!hasPremium && overflowType && !isCuratedExemptSource) {
      set({ limitWarning: `Limit reached: copy (${overflowType})` });
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
    const sourceSheet = normalizeSheetVisibility(await getSheet(token, sheetId));
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
      const sheet = normalizeSheetVisibility(await getSheet(token, sheetId));
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
        sheets: updateSheetInCollection(get().sheets, sheet.id, sheet),
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

    const payload = await buildSafeSheetUpdatePayload({
      token,
      sheetId: activeSheetId,
      getState: get,
      overrideFields: { title: sheetTitle, topics },
    });

    const persistPromise = saveSheet(token, activeSheetId, payload)
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
      const payload = await buildSafeSheetUpdatePayload({
        token,
        sheetId: activeSheetId,
        getState: get,
        overrideFields: { title: sheetTitle, topics },
      });
      await saveSheet(token, activeSheetId, payload);
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
    const payload = await buildSafeSheetUpdatePayload({
      token,
      sheetId,
      getState: get,
      overrideFields: { title },
      includeContent: false,
    });
    const updatedSheet = normalizeSheetVisibility(await saveSheet(token, sheetId, payload));
    set((state) => {
      const nextActiveState = state.activeSheetId === sheetId ? { sheetTitle: title } : {};
      return {
        ...nextActiveState,
        sheets: updateSheetInCollection(state.sheets, sheetId, updatedSheet || { title }),
      };
    });
  },

  setSheetVisibility: async (token, sheetId, isPublic) => {
    set((state) => ({
      sheets: updateSheetInCollection(state.sheets, sheetId, { isPublic }),
    }));

    try {
      const payload = await buildSafeSheetUpdatePayload({
        token,
        sheetId,
        getState: get,
        overrideFields: { isPublic },
        includeContent: false,
      });
      const updatedSheet = normalizeSheetVisibility(await saveSheet(token, sheetId, payload));
      if (updatedSheet) {
        set((state) => ({
          sheets: updateSheetInCollection(state.sheets, sheetId, updatedSheet),
        }));
      }
      return true;
    } catch (error) {
      set((state) => ({
        sheets: updateSheetInCollection(state.sheets, sheetId, { isPublic: !isPublic }),
      }));
      throw error;
    }
  },

  setSheetArchived: async (token, sheetId, isArchived) => {
    set((state) => ({
      sheets: updateSheetInCollection(state.sheets, sheetId, { isArchived }),
    }));

    try {
      const payload = await buildSafeSheetUpdatePayload({
        token,
        sheetId,
        getState: get,
        overrideFields: { isArchived },
        includeContent: false,
      });
      const updatedSheet = normalizeSheetVisibility(await saveSheet(token, sheetId, payload));
      if (updatedSheet) {
        set((state) => ({
          sheets: updateSheetInCollection(state.sheets, sheetId, updatedSheet),
        }));
      }
      return true;
    } catch (error) {
      set((state) => ({
        sheets: updateSheetInCollection(state.sheets, sheetId, { isArchived: !isArchived }),
      }));
      throw error;
    }
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
