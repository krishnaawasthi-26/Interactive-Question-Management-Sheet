// Shared limits/config for the sheet store modules.
const UNBOUNDED_LIMIT = 2_147_483_647;

export const FREE_LIMITS = {
  topics: 50,
  subTopics: 50,
  questions: 100,
  sheets: 5,
};

export const PREMIUM_LIMITS = {
  topics: UNBOUNDED_LIMIT,
  subTopics: UNBOUNDED_LIMIT,
  questions: UNBOUNDED_LIMIT,
  sheets: UNBOUNDED_LIMIT,
};

export const MAX_WORDS_PER_ENTRY = 50;

export const HISTORY_LIMIT = UNBOUNDED_LIMIT;
export const MAX_SHEETS = FREE_LIMITS.sheets;
