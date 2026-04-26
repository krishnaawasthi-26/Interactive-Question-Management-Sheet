export const getQuestionAttemptLogs = (question) => {
  if (Array.isArray(question?.attemptLogs) && question.attemptLogs.length > 0) return question.attemptLogs;
  if (question?.attemptLog) return [question.attemptLog];
  return [];
};

export const getLatestAttempt = (question) => {
  const logs = getQuestionAttemptLogs(question);
  return logs.length > 0 ? logs[logs.length - 1] : null;
};

export const getLatestAttemptResult = (question) => {
  const latestAttempt = getLatestAttempt(question);
  return latestAttempt?.result || "unresolved";
};

export const isQuestionCompleted = (question) => getLatestAttemptResult(question) === "solved";

export const getSubtopicProgress = (subtopic) => {
  const questions = Array.isArray(subtopic?.questions) ? subtopic.questions : [];
  const baseCounts = { solved: 0, partially_solved: 0, failed: 0, unresolved: 0 };

  const resultCounts = questions.reduce((accumulator, question) => {
    const result = getLatestAttemptResult(question);
    if (result in accumulator) {
      accumulator[result] += 1;
    } else {
      accumulator.unresolved += 1;
    }
    return accumulator;
  }, baseCounts);

  const totalQuestions = questions.length;
  const completedQuestions = resultCounts.solved;

  return {
    totalQuestions,
    completedQuestions,
    percent: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
    resultCounts,
    isCompleted: totalQuestions > 0 && completedQuestions === totalQuestions,
  };
};

export const getTopicProgress = (topic) => {
  const subtopics = Array.isArray(topic?.subTopics) ? topic.subTopics : [];
  const subtopicProgress = subtopics.map(getSubtopicProgress);

  const completedSubtopics = subtopicProgress.filter((entry) => entry.isCompleted).length;
  const inProgressSubtopics = subtopicProgress.filter((entry) => !entry.isCompleted && entry.totalQuestions > 0 && entry.completedQuestions > 0).length;
  const totalSubtopics = subtopics.length;

  return {
    totalSubtopics,
    completedSubtopics,
    inProgressSubtopics,
    notStartedSubtopics: Math.max(totalSubtopics - completedSubtopics - inProgressSubtopics, 0),
    percent: totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0,
  };
};
