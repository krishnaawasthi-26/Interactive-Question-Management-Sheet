//done
export const createTopic = (title) => ({
  id: Date.now(),
  title,
  subTopics: [],
});

export const createSubTopic = (title) => ({
  id: Date.now(),
  title,
  questions: [],
});

export const createQuestion = (text) => ({
  id: Date.now(),
  text,
  link: "",
});

export const updateTopicById = (topics, topicId, updater) =>
  topics.map((topic) =>
    topic.id === topicId ? updater(topic) : topic
  );

export const updateSubTopicById = (subTopics, subId, updater) =>
  subTopics.map((subTopic) =>
    subTopic.id === subId ? updater(subTopic) : subTopic
  );

export const updateQuestionById = (questions, questionId, updater) =>
  questions.map((question) =>
    question.id === questionId ? updater(question) : question
  );

export const reorderArray = (items, startIndex, endIndex) => {
  const nextItems = Array.from(items);
  const [removed] = nextItems.splice(startIndex, 1);
  nextItems.splice(endIndex, 0, removed);
  return nextItems;
};
