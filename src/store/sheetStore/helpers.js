// Generic helpers reused across slices to keep behavior consistent.
export const cloneDeep = (value) => JSON.parse(JSON.stringify(value));

export const buildSheetSignature = (title, topics) => JSON.stringify({ title, topics });

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

export const computeDirtyState = (state, signatureBySheet) =>
  buildSheetSignature(state.sheetTitle, state.topics) !== signatureBySheet.get(state.activeSheetId);

export const applyTopicsWithHistoryAndDirty = (state, nextTopics, withHistory, signatureBySheet) => {
  const nextState = withHistory(state, nextTopics);
  return { ...nextState, hasPendingChanges: computeDirtyState({ ...state, topics: nextState.topics }, signatureBySheet) };
};
