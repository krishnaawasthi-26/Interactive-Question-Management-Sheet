export const calculateSheetProgress = (sheet) => {
  const topics = Array.isArray(sheet?.topics) ? sheet.topics : [];
  let totalQuestions = 0;
  let completedQuestions = 0;

  topics.forEach((topic) => {
    const subTopics = Array.isArray(topic?.subTopics) ? topic.subTopics : [];
    subTopics.forEach((subTopic) => {
      const questions = Array.isArray(subTopic?.questions) ? subTopic.questions : [];
      questions.forEach((question) => {
        totalQuestions += 1;
        if (question?.done) {
          completedQuestions += 1;
        }
      });
    });
  });

  const percent = totalQuestions === 0 ? 0 : Math.round((completedQuestions / totalQuestions) * 100);
  return { totalQuestions, completedQuestions, percent };
};

export const calculateOverallProgress = (sheets) => {
  const safeSheets = Array.isArray(sheets) ? sheets : [];
  const summary = safeSheets.reduce(
    (accumulator, sheet) => {
      const progress = calculateSheetProgress(sheet);
      return {
        completedQuestions: accumulator.completedQuestions + progress.completedQuestions,
        totalQuestions: accumulator.totalQuestions + progress.totalQuestions,
      };
    },
    { completedQuestions: 0, totalQuestions: 0 }
  );

  return {
    ...summary,
    percent:
      summary.totalQuestions === 0
        ? 0
        : Math.round((summary.completedQuestions / summary.totalQuestions) * 100),
  };
};
