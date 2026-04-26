// Generic helpers reused across slices to keep behavior consistent.
export const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

export const buildSheetSignature = (title, topics, topicTags = [], userCustomTopics = []) =>
  JSON.stringify({ title, topics, topicTags, userCustomTopics });

export const reorderArray = (items, startIndex, endIndex) => {
  const nextItems = Array.from(items);
  const [removed] = nextItems.splice(startIndex, 1);
  nextItems.splice(endIndex, 0, removed);
  return nextItems;
};

export const countSubTopics = (topics) =>
  topics.reduce((count, topic) => count + (topic.subTopics?.length || 0), 0);

export const countQuestions = (topics) =>
  topics.reduce(
    (count, topic) =>
      count +
      (topic.subTopics || []).reduce(
        (subCount, subTopic) => subCount + (subTopic.questions?.length || 0),
        0
      ),
    0
  );

export const updateSheetInCollection = (sheets, sheetId, updates) =>
  sheets.map((sheet) => (sheet.id === sheetId ? { ...sheet, ...updates } : sheet));

export const normalizeSheetVisibility = (sheet) => {
  if (!sheet || typeof sheet !== "object") return sheet;

  const normalized = { ...sheet };
  if (typeof normalized.isPublic !== "boolean" && typeof normalized.public === "boolean") {
    normalized.isPublic = normalized.public;
  }
  if (typeof normalized.isArchived !== "boolean" && typeof normalized.archived === "boolean") {
    normalized.isArchived = normalized.archived;
  }
  if (typeof normalized.shareProgress !== "boolean") {
    normalized.shareProgress = false;
  }

  return normalized;
};

export const computeDirtyState = (state, signatureBySheet) =>
  buildSheetSignature(state.sheetTitle, state.topics, state.topicTags, state.userCustomTopics) !== signatureBySheet.get(state.activeSheetId);

export const applyTopicsWithHistoryAndDirty = (state, nextTopics, withHistory, signatureBySheet) => {
  const nextState = withHistory(state, nextTopics);
  return { ...nextState, hasPendingChanges: computeDirtyState({ ...state, topics: nextState.topics }, signatureBySheet) };
};
