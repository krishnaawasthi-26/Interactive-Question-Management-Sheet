const EXPORT_VERSION = 2;

const ORDER_FIELD_CANDIDATES = ["order", "position", "index", "sortOrder"];

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asNonEmptyString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const toOptionalString = (value) => (typeof value === "string" ? value : "");

const parseDateOrNow = (value) => {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }

  return new Date().toISOString();
};

const pickOrderValue = (item, fallbackIndex) => {
  for (const key of ORDER_FIELD_CANDIDATES) {
    const candidate = item?.[key];
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallbackIndex;
};

const stableSortByOrder = (items) =>
  items
    .map((item, index) => ({ item, index, orderValue: pickOrderValue(item, index) }))
    .sort((a, b) => a.orderValue - b.orderValue || a.index - b.index)
    .map(({ item }) => item);

const normalizeQuestion = ({ question, topicIndex, subTopicIndex, questionIndex, errors }) => {
  if (!isObject(question)) {
    errors.push(`topic[${topicIndex}].subTopics[${subTopicIndex}].questions[${questionIndex}] must be an object.`);
    return null;
  }

  const text = asNonEmptyString(question.text, question.questionText, question.question, question.prompt);
  if (!text) {
    errors.push(`topic[${topicIndex}].subTopics[${subTopicIndex}].questions[${questionIndex}].text is required.`);
  }

  return {
    id: asNonEmptyString(question.id) || `q_${Date.now()}_${topicIndex}_${subTopicIndex}_${questionIndex}`,
    text,
    answer: toOptionalString(question.answer),
    link: toOptionalString(question.link),
    articleLink: toOptionalString(question.articleLink),
    videoLink: toOptionalString(question.videoLink),
    notes: toOptionalString(question.notes),
    done: Boolean(question.done),
    confidence: toOptionalString(question.confidence),
    lastReviewedAt: toOptionalString(question.lastReviewedAt),
    nextReviewAt: toOptionalString(question.nextReviewAt),
    reminderAt: toOptionalString(question.reminderAt),
    order: pickOrderValue(question, questionIndex),
  };
};

const buildLegacySubTopicLookup = (candidate) => {
  const topicIdBySubTopicId = new Map();
  const groupedSubTopics = new Map();
  const subTopics = Array.isArray(candidate?.subTopics) ? candidate.subTopics : Array.isArray(candidate?.subtopics) ? candidate.subtopics : [];

  subTopics.forEach((subTopic, idx) => {
    if (!isObject(subTopic)) return;
    const topicId = asNonEmptyString(subTopic.topicId, subTopic.parentTopicId);
    const subTopicId = asNonEmptyString(subTopic.id, `legacy_sub_${idx}`);
    topicIdBySubTopicId.set(subTopicId, topicId);

    const key = topicId || "__orphans__";
    const collection = groupedSubTopics.get(key) || [];
    collection.push(subTopic);
    groupedSubTopics.set(key, collection);
  });

  return { topicIdBySubTopicId, groupedSubTopics };
};

const buildLegacyQuestionLookup = (candidate) => {
  const groupedQuestions = new Map();
  const questions = Array.isArray(candidate?.questions) ? candidate.questions : [];

  questions.forEach((question) => {
    if (!isObject(question)) return;
    const subTopicId = asNonEmptyString(question.subTopicId, question.subtopicId, question.parentSubTopicId);
    const key = subTopicId || "__orphans__";
    const collection = groupedQuestions.get(key) || [];
    collection.push(question);
    groupedQuestions.set(key, collection);
  });

  return groupedQuestions;
};

export const normalizeTopicsForExport = (topics = []) => {
  if (!Array.isArray(topics)) return [];

  return stableSortByOrder(topics)
    .filter(isObject)
    .map((topic, topicIndex) => {
      const sourceSubTopics = Array.isArray(topic.subTopics)
        ? topic.subTopics
        : Array.isArray(topic.subtopics)
          ? topic.subtopics
          : [];

      return {
        id: asNonEmptyString(topic.id) || `topic_${Date.now()}_${topicIndex}`,
        title: asNonEmptyString(topic.title, topic.name) || "Untitled topic",
        order: pickOrderValue(topic, topicIndex),
        subTopics: stableSortByOrder(sourceSubTopics)
          .filter(isObject)
          .map((subTopic, subTopicIndex) => {
            const sourceQuestions = Array.isArray(subTopic.questions) ? subTopic.questions : [];
            return {
              id: asNonEmptyString(subTopic.id) || `sub_${Date.now()}_${topicIndex}_${subTopicIndex}`,
              title: asNonEmptyString(subTopic.title, subTopic.name) || "Untitled subtopic",
              order: pickOrderValue(subTopic, subTopicIndex),
              questions: stableSortByOrder(sourceQuestions)
                .filter(isObject)
                .map((question, questionIndex) => ({
                  id: asNonEmptyString(question.id) || `q_${Date.now()}_${topicIndex}_${subTopicIndex}_${questionIndex}`,
                  text: asNonEmptyString(question.text, question.questionText, question.question, question.prompt),
                  answer: toOptionalString(question.answer),
                  link: toOptionalString(question.link),
                  articleLink: toOptionalString(question.articleLink),
                  videoLink: toOptionalString(question.videoLink),
                  notes: toOptionalString(question.notes),
                  done: Boolean(question.done),
                  confidence: toOptionalString(question.confidence),
                  lastReviewedAt: toOptionalString(question.lastReviewedAt),
                  nextReviewAt: toOptionalString(question.nextReviewAt),
                  reminderAt: toOptionalString(question.reminderAt),
                  order: pickOrderValue(question, questionIndex),
                })),
            };
          }),
      };
    });
};

export const buildSheetExportPayload = ({ sheetTitle, topics }) => ({
  exportVersion: EXPORT_VERSION,
  id: `sheet_${Date.now()}`,
  name: asNonEmptyString(sheetTitle) || "Question Sheet",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  topics: normalizeTopicsForExport(topics),
});

export const normalizeImportedSheet = (candidate) => {
  const errors = [];

  if (!isObject(candidate)) {
    return { valid: false, errors: ["JSON root must be an object."], normalized: null };
  }

  const sheetName = asNonEmptyString(candidate.name, candidate.title, candidate.sheetTitle);
  if (!sheetName) {
    errors.push("`name` (or legacy `title`) is required and must be a non-empty string.");
  }

  const sourceTopics = Array.isArray(candidate.topics)
    ? candidate.topics
    : Array.isArray(candidate.topicList)
      ? candidate.topicList
      : [];

  if (!Array.isArray(sourceTopics) || sourceTopics.length === 0) {
    errors.push("`topics` is required and must be a non-empty array.");
  }

  const { groupedSubTopics } = buildLegacySubTopicLookup(candidate);
  const groupedQuestions = buildLegacyQuestionLookup(candidate);

  const normalizedTopics = stableSortByOrder(sourceTopics)
    .map((topic, topicIndex) => {
      if (!isObject(topic)) {
        errors.push(`topic[${topicIndex}] must be an object.`);
        return null;
      }

      const topicTitle = asNonEmptyString(topic.title, topic.name);
      if (!topicTitle) {
        errors.push(`topic[${topicIndex}].title is required.`);
      }

      const topicId = asNonEmptyString(topic.id, `topic_${Date.now()}_${topicIndex}`);
      const nestedSubTopics = Array.isArray(topic.subTopics)
        ? topic.subTopics
        : Array.isArray(topic.subtopics)
          ? topic.subtopics
          : groupedSubTopics.get(topicId) || [];

      if (!Array.isArray(nestedSubTopics)) {
        errors.push(`topic[${topicIndex}].subTopics must be an array.`);
      }

      const normalizedSubTopics = stableSortByOrder(Array.isArray(nestedSubTopics) ? nestedSubTopics : [])
        .map((subTopic, subIndex) => {
          if (!isObject(subTopic)) {
            errors.push(`topic[${topicIndex}].subTopics[${subIndex}] must be an object.`);
            return null;
          }

          const subTitle = asNonEmptyString(subTopic.title, subTopic.name);
          if (!subTitle) {
            errors.push(`topic[${topicIndex}].subTopics[${subIndex}].title is required.`);
          }

          const subTopicId = asNonEmptyString(subTopic.id, `sub_${Date.now()}_${topicIndex}_${subIndex}`);
          const sourceQuestions = Array.isArray(subTopic.questions)
            ? subTopic.questions
            : groupedQuestions.get(subTopicId) || [];

          if (!Array.isArray(sourceQuestions)) {
            errors.push(`topic[${topicIndex}].subTopics[${subIndex}].questions must be an array.`);
          }

          const normalizedQuestions = stableSortByOrder(Array.isArray(sourceQuestions) ? sourceQuestions : [])
            .map((question, questionIndex) =>
              normalizeQuestion({
                question,
                topicIndex,
                subTopicIndex: subIndex,
                questionIndex,
                errors,
              })
            )
            .filter(Boolean);

          return {
            id: subTopicId,
            title: subTitle,
            order: pickOrderValue(subTopic, subIndex),
            questions: normalizedQuestions,
          };
        })
        .filter(Boolean);

      return {
        id: topicId,
        title: topicTitle,
        order: pickOrderValue(topic, topicIndex),
        subTopics: normalizedSubTopics,
      };
    })
    .filter(Boolean);

  const normalized = {
    exportVersion: Number(candidate.exportVersion) || EXPORT_VERSION,
    id: asNonEmptyString(candidate.id) || `sheet_${Date.now()}`,
    name: sheetName,
    createdAt: parseDateOrNow(candidate.createdAt),
    updatedAt: new Date().toISOString(),
    topics: normalizedTopics,
  };

  return { valid: errors.length === 0, errors, normalized };
};

export { isObject, stableSortByOrder };
