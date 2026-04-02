const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const validateSheetJson = (candidate) => {
  const errors = [];

  if (!isObject(candidate)) {
    return { valid: false, errors: ["JSON root must be an object."], normalized: null };
  }

  if (typeof candidate.name !== "string" || !candidate.name.trim()) {
    errors.push("`name` is required and must be a non-empty string.");
  }

  if (!Array.isArray(candidate.topics)) {
    errors.push("`topics` is required and must be an array.");
  }

  const normalizedTopics = Array.isArray(candidate.topics)
    ? candidate.topics.map((topic, topicIndex) => {
        if (!isObject(topic)) {
          errors.push(`topic[${topicIndex}] must be an object.`);
          return null;
        }

        if (typeof topic.title !== "string" || !topic.title.trim()) {
          errors.push(`topic[${topicIndex}].title is required.`);
        }

        if (!Array.isArray(topic.subTopics)) {
          errors.push(`topic[${topicIndex}].subTopics must be an array.`);
        }

        const normalizedSubTopics = Array.isArray(topic.subTopics)
          ? topic.subTopics.map((subTopic, subIndex) => {
              if (!isObject(subTopic)) {
                errors.push(`topic[${topicIndex}].subTopics[${subIndex}] must be an object.`);
                return null;
              }

              if (typeof subTopic.title !== "string" || !subTopic.title.trim()) {
                errors.push(`topic[${topicIndex}].subTopics[${subIndex}].title is required.`);
              }

              if (!Array.isArray(subTopic.questions)) {
                errors.push(
                  `topic[${topicIndex}].subTopics[${subIndex}].questions must be an array.`
                );
              }

              const normalizedQuestions = Array.isArray(subTopic.questions)
                ? subTopic.questions.map((question, questionIndex) => {
                    if (!isObject(question)) {
                      errors.push(
                        `topic[${topicIndex}].subTopics[${subIndex}].questions[${questionIndex}] must be an object.`
                      );
                      return null;
                    }

                    if (typeof question.text !== "string" || !question.text.trim()) {
                      errors.push(
                        `topic[${topicIndex}].subTopics[${subIndex}].questions[${questionIndex}].text is required.`
                      );
                    }

                    return {
                      id: question.id ?? `q_${Date.now()}_${topicIndex}_${subIndex}_${questionIndex}`,
                      text: question.text ?? "",
                      answer: question.answer ?? "",
                      link: question.link ?? "",
                    };
                  })
                : [];

              return {
                id: subTopic.id ?? `sub_${Date.now()}_${topicIndex}_${subIndex}`,
                title: subTopic.title ?? "",
                questions: normalizedQuestions.filter(Boolean),
              };
            })
          : [];

        return {
          id: topic.id ?? `topic_${Date.now()}_${topicIndex}`,
          title: topic.title ?? "",
          subTopics: normalizedSubTopics.filter(Boolean),
        };
      })
    : [];

  const normalized = {
    id: candidate.id ?? `sheet_${Date.now()}`,
    name: candidate.name ?? "",
    createdAt: candidate.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    topics: normalizedTopics.filter(Boolean),
  };

  return { valid: errors.length === 0, errors, normalized };
};
