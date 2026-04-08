// Shared immutable update selectors/helpers for nested topic/subtopic/question structures.
export const mapQuestion = (topics, topicId, subId, updater) =>
  topics.map((topic) =>
    topic.id !== topicId
      ? topic
      : {
          ...topic,
          subTopics: topic.subTopics.map((subTopic) =>
            subTopic.id !== subId
              ? subTopic
              : {
                  ...subTopic,
                  questions: subTopic.questions.map((question) =>
                    updater(question) ?? question
                  ),
                }
          ),
        }
  );

export const updateQuestionById = (topics, topicId, subId, questionId, questionUpdater) =>
  mapQuestion(topics, topicId, subId, (question) =>
    question.id !== questionId ? question : questionUpdater(question)
  );
