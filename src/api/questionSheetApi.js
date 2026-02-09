const API_BASE_URL =
  "https://node.codolio.com/api/question-tracker/v1/sheet/public/get-sheet-by-slug/striver-sde-sheet";
const LOCAL_STORAGE_KEY = "question-sheet";

const isBrowser = typeof window !== "undefined";

const getStorageKey = (slug) =>
  slug ? `${LOCAL_STORAGE_KEY}:${slug}` : LOCAL_STORAGE_KEY;

const readLocalSheet = (slug) => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(getStorageKey(slug));
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (slug && parsed?.slug && parsed.slug !== slug) return null;
  return parsed;
};

const writeLocalSheet = (sheet, slug) => {
  if (!isBrowser) return;
  window.localStorage.setItem(getStorageKey(slug), JSON.stringify(sheet));
};

const normalizeQuestion = (question, index, fallbackIdPrefix) => {
  if (typeof question === "string") {
    return {
      id: `${fallbackIdPrefix}-q-${index}`,
      text: question,
      link: "",
    };
  }

  return {
    id:
      question?.id ??
      question?._id ??
      question?.questionId ??
      `${fallbackIdPrefix}-q-${index}`,
    text:
      question?.text ??
      question?.question ??
      question?.questionTitle ??
      question?.title ??
      question?.name ??
      `Question ${index + 1}`,
    link:
      question?.link ??
      question?.url ??
      question?.problemLink ??
      question?.questionLink ??
      question?.leetcodeLink ??
      question?.gfgLink ??
      "",
  };
};

const normalizeSubTopic = (subTopic, index, fallbackIdPrefix) => {
  const subId =
    subTopic?.id ??
    subTopic?._id ??
    subTopic?.subTopicId ??
    `${fallbackIdPrefix}-s-${index}`;
  const rawQuestions =
    subTopic?.questions ??
    subTopic?.questionList ??
    subTopic?.questionsList ??
    subTopic?.problemList ??
    subTopic?.problems ??
    [];
  const questions = rawQuestions.map((question, qIndex) =>
    normalizeQuestion(question, qIndex, subId)
  );

  return {
    id: subId,
    title:
      subTopic?.title ??
      subTopic?.name ??
      subTopic?.subTopic ??
      subTopic?.topic ??
      `Subtopic ${index + 1}`,
    questions,
  };
};

const normalizeTopic = (topic, index) => {
  const topicId =
    topic?.id ?? topic?._id ?? topic?.topicId ?? `t-${index + 1}`;
  const rawSubTopics =
    topic?.subTopics ??
    topic?.subTopicList ??
    topic?.subtopics ??
    topic?.sub_topics ??
    [];
  const subTopics = rawSubTopics.map((subTopic, sIndex) =>
    normalizeSubTopic(subTopic, sIndex, topicId)
  );

  if (!subTopics.length) {
    const rawQuestions =
      topic?.questions ??
      topic?.questionList ??
      topic?.questionsList ??
      topic?.problemList ??
      topic?.problems ??
      [];
    if (rawQuestions.length) {
      subTopics.push({
        id: `${topicId}-s-0`,
        title: "Questions",
        questions: rawQuestions.map((question, qIndex) =>
          normalizeQuestion(question, qIndex, topicId)
        ),
      });
    }
  }

  return {
    id: topicId,
    title:
      topic?.title ??
      topic?.name ??
      topic?.topic ??
      topic?.topicName ??
      `Topic ${index + 1}`,
    subTopics,
  };
};

const normalizeSheet = (payload, slug) => {
  const rawTopics = payload?.topics ?? payload?.topicList ?? [];
  const topics = rawTopics.map((topic, index) =>
    normalizeTopic(topic, index)
  );
  return {
    slug: payload?.slug ?? slug ?? "local-sheet",
    title: payload?.title ?? payload?.name ?? "Question Sheet",
    topics,
  };
};

export const fetchSheetBySlug = async (slug, { forceRefresh = false } = {}) => {
  const localSheet = readLocalSheet(slug);
  if (
    localSheet &&
    !forceRefresh &&
    Array.isArray(localSheet.topics) &&
    localSheet.topics.length > 0
  ) {
    return localSheet;
  }

  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error("Failed to fetch sheet");
    const data = await response.json();
    const payload = data?.data?.sheet ?? data?.data ?? data?.sheet ?? data;
    const sheet = normalizeSheet(payload, slug);
    writeLocalSheet(sheet, slug);
    return sheet;
  } catch (error) {
    if (localSheet) return localSheet;
    return normalizeSheet({ topics: [] }, slug);
  }
};

export const persistSheet = (sheet) => {
  writeLocalSheet(sheet, sheet?.slug);
  return Promise.resolve(sheet);
};

export const clearLocalSheet = (slug) => {
  if (!isBrowser) return;
  window.localStorage.removeItem(getStorageKey(slug));
};
