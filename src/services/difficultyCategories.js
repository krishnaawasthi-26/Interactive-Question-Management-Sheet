import { isQuestionCompleted } from "./questionProgress";

export const DEFAULT_DIFFICULTY_CATEGORIES = [
  { key: "basic", label: "Basic", color: "#64748b", type: "default", tier: "default" },
  { key: "easy", label: "Easy", color: "#22c55e", type: "default", tier: "default" },
  { key: "medium", label: "Medium", color: "#f59e0b", type: "default", tier: "default" },
  { key: "hard", label: "Hard", color: "#ef4444", type: "default", tier: "default" },
  { key: "learn_concept", label: "Learn / Concept", color: "#06b6d4", type: "default", tier: "extra" },
  { key: "complex", label: "Complex", color: "#ec4899", type: "default", tier: "extra" },
  { key: "impossible", label: "Impossible", color: "#7f1d1d", type: "default", tier: "extra" },
];

export const DEFAULT_DIFFICULTY_KEY = "medium";

export const buildCategoryValue = (category) =>
  category?.type === "custom" ? `custom:${category.id}` : `default:${category.key}`;

export const resolveQuestionDifficulty = (question = {}, allCategories = []) => {
  if (question.difficultyCategoryId) {
    const custom = allCategories.find((entry) => entry.type === "custom" && entry.id === question.difficultyCategoryId);
    if (custom) return custom;
  }

  const key = `${question.difficultyKey || question.difficulty || DEFAULT_DIFFICULTY_KEY}`.trim().toLowerCase();
  return allCategories.find((entry) => entry.type === "default" && entry.key === key)
    || allCategories.find((entry) => entry.type === "default" && entry.key === DEFAULT_DIFFICULTY_KEY)
    || DEFAULT_DIFFICULTY_CATEGORIES.find((entry) => entry.key === DEFAULT_DIFFICULTY_KEY);
};

export const buildCategoryLabelAndColor = (question = {}, allCategories = []) => {
  const resolved = resolveQuestionDifficulty(question, allCategories);
  return {
    label: question.difficultyLabel || resolved?.label || "Medium",
    color: question.difficultyColor || resolved?.color || "#f59e0b",
  };
};

export const buildDistribution = (topics = [], allCategories = []) => {
  const map = new Map();
  let total = 0;
  topics.forEach((topic) => {
    (topic.subTopics || []).forEach((sub) => {
      (sub.questions || []).forEach((question) => {
        total += 1;
        const resolved = resolveQuestionDifficulty(question, allCategories);
        const key = resolved?.type === "custom" ? `custom:${resolved.id}` : `default:${resolved?.key || DEFAULT_DIFFICULTY_KEY}`;
        const current = map.get(key) || {
          key,
          label: question.difficultyLabel || resolved?.label || "Medium",
          color: question.difficultyColor || resolved?.color || "#f59e0b",
          count: 0,
          completed: 0,
        };
        current.count += 1;
        if (isQuestionCompleted(question)) current.completed += 1;
        map.set(key, current);
      });
    });
  });

  return {
    total,
    categories: [...map.values()].sort((a, b) => b.count - a.count).map((entry) => ({
      ...entry,
      percent: total ? Math.round((entry.count / total) * 100) : 0,
    })),
  };
};
