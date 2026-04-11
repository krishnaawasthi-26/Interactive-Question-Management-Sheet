// Shared limits/config for the sheet store modules.
const UNBOUNDED_LIMIT = 2_147_483_647;

export const FREE_LIMITS = {
  topics: 30,
  subTopics: 50,
  questions: 100,
};

export const PREMIUM_LIMITS = {
  topics: 100,
  subTopics: 200,
  questions: 1000,
};

export const MAX_WORDS_PER_ENTRY = 50;

export const HISTORY_LIMIT = UNBOUNDED_LIMIT;
export const MAX_SHEETS = UNBOUNDED_LIMIT;
