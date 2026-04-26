const DEFAULT_PALETTE = [
  "#6366f1", "#14b8a6", "#f97316", "#8b5cf6", "#22c55e", "#eab308", "#ef4444", "#06b6d4", "#f43f5e", "#a3e635",
];

const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");

const fallbackId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const generateTopicTagId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tag_${crypto.randomUUID()}`;
  }
  return fallbackId("tag");
};

export const pickDistinctColor = (usedColors = [], seedIndex = 0) => {
  const available = DEFAULT_PALETTE.filter((color) => !usedColors.includes(color));
  if (available.length) return available[seedIndex % available.length];
  return DEFAULT_PALETTE[seedIndex % DEFAULT_PALETTE.length];
};

export const hydrateTopicTags = ({ topics = [], topicTags = [], userCustomTopics = [] }) => {
  const hydratedTags = [];
  const tagById = new Map();

  const upsert = (tag) => {
    if (!tag?.id || !tag?.name) return;
    if (tagById.has(tag.id)) return;
    const normalized = {
      id: tag.id,
      name: normalizeName(tag.name).slice(0, 48),
      color: tag.color || pickDistinctColor(hydratedTags.map((entry) => entry.color), hydratedTags.length),
      type: tag.type === "CUSTOM" ? "CUSTOM" : "DEFAULT",
      ownerId: tag.ownerId || null,
      createdAt: tag.createdAt || new Date().toISOString(),
      updatedAt: tag.updatedAt || new Date().toISOString(),
    };
    tagById.set(normalized.id, normalized);
    hydratedTags.push(normalized);
  };

  topicTags.forEach(upsert);

  topics.forEach((topic, topicIndex) => {
    const defaultId = `default-topic-${topic.id}`;
    upsert({
      id: defaultId,
      name: topic.title || `Topic ${topicIndex + 1}`,
      color: pickDistinctColor(hydratedTags.map((entry) => entry.color), topicIndex),
      type: "DEFAULT",
    });

    (topic.subTopics || []).forEach((sub) => {
      (sub.questions || []).forEach((question) => {
        const previous = Array.isArray(question.topicTagIds) ? question.topicTagIds : [];
        const nextIds = [...new Set([defaultId, ...previous])].filter((id) => tagById.has(id));
        question.topicTagIds = nextIds.length ? nextIds : [defaultId];
      });
    });
  });

  const normalizedCustom = (userCustomTopics || []).filter((tag) => tag?.id && tagById.has(tag.id));

  return {
    topics,
    topicTags: hydratedTags,
    userCustomTopics: normalizedCustom,
  };
};

export const buildTopicDistribution = (topics = [], topicTags = []) => {
  const counts = new Map();
  topicTags.forEach((tag) => counts.set(tag.id, 0));

  topics.forEach((topic) => {
    (topic.subTopics || []).forEach((sub) => {
      (sub.questions || []).forEach((question) => {
        const ids = Array.isArray(question.topicTagIds) ? [...new Set(question.topicTagIds)] : [];
        ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
      });
    });
  });

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const items = topicTags
    .map((tag) => {
      const count = counts.get(tag.id) || 0;
      return {
        key: tag.id,
        label: tag.name,
        color: tag.color,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    })
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  return { total, items };
};

export const tagNameExists = (topicTags, name, excludingId = null) => {
  const normalized = normalizeName(name).toLowerCase();
  if (!normalized) return false;
  return topicTags.some((tag) => tag.id !== excludingId && normalizeName(tag.name).toLowerCase() === normalized);
};

export const normalizeTagName = normalizeName;
