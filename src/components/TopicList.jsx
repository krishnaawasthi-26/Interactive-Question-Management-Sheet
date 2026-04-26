import { useEffect, useMemo, useState } from "react";
import { useSheetStore } from "../store/sheetStore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AttemptLogModal from "./AttemptLogModal";
import DifficultyCategorySelector from "./DifficultyCategorySelector";
import CustomDifficultyModal from "./CustomDifficultyModal";
import { buildCategoryValue, DEFAULT_DIFFICULTY_CATEGORIES, resolveQuestionDifficulty } from "../services/difficultyCategories";
import TopicTagSelector from "./TopicTagSelector";
import CustomTopicModal from "./CustomTopicModal";
import DifficultyBadge from "./DifficultyBadge";
import TopicChipsPreview from "./TopicChipsPreview";
import QuestionDetailsDrawer from "./QuestionDetailsDrawer";
import {
  getLatestAttemptResult,
  getQuestionAttemptLogs,
  getSubtopicProgress,
  getTopicProgress,
  isQuestionCompleted,
} from "../services/questionProgress";

const normalizeText = (value) =>
  `${value || ""}`.trim().toLowerCase().replace(/\s+/g, " ");

const ATTEMPT_RESULT_META = {
  failed: {
    tickClasses: "border-[var(--accent-danger)] bg-[color-mix(in_srgb,var(--accent-danger)_24%,var(--surface))] text-[var(--accent-danger)]",
    label: "Error / Attempted",
    color: "var(--accent-danger)",
  },
  partially_solved: {
    tickClasses: "border-[color-mix(in_srgb,var(--accent-warning)_78%,var(--accent-info))] bg-[color-mix(in_srgb,var(--accent-warning)_30%,var(--surface))] text-[color-mix(in_srgb,var(--accent-warning)_88%,black)]",
    label: "Partially Solved",
    color: "color-mix(in srgb, var(--accent-warning) 80%, var(--accent-info))",
  },
  solved: {
    tickClasses: "border-[var(--accent-success)] bg-[color-mix(in_srgb,var(--accent-success)_24%,var(--surface))] text-[var(--accent-success)]",
    label: "Solved",
    color: "var(--accent-success)",
  },
  unresolved: {
    tickClasses: "border-[var(--border-strong)] bg-transparent text-transparent",
    label: "Unsolved",
    color: "var(--border-strong)",
  },
};

function TopicList({
  isEditing = true,
  searchQuery = "",
  onlyExactMatch = false,
  allowProgressToggle = true,
  allowReorder = true,
  focusProblemId = null,
  showAttemptInsights = true,
  premiumActive = false,
  onPremiumLocked,
  onRequireCopy,
  difficultyCategories = [],
  onCreateCustomDifficulty,
  topicTags = [],
}) {
  const topics = useSheetStore((state) => state.topics);
  const addSubTopic = useSheetStore((state) => state.addSubTopic);
  const addQuestion = useSheetStore((state) => state.addQuestion);
  const editTopic = useSheetStore((state) => state.editTopic);
  const deleteTopic = useSheetStore((state) => state.deleteTopic);
  const editSubTopic = useSheetStore((state) => state.editSubTopic);
  const deleteSubTopic = useSheetStore((state) => state.deleteSubTopic);
  const editQuestion = useSheetStore((state) => state.editQuestion);
  const deleteQuestion = useSheetStore((state) => state.deleteQuestion);
  const updateQuestionResources = useSheetStore((state) => state.updateQuestionResources);
  const moveSubTopic = useSheetStore((state) => state.moveSubTopic);
  const reorderTopics = useSheetStore((state) => state.reorderTopics);
  const moveQuestion = useSheetStore((state) => state.moveQuestion);
  const updateQuestionAttempt = useSheetStore((state) => state.updateQuestionAttempt);
  const toggleQuestionRevised = useSheetStore((state) => state.toggleQuestionRevised);
  const setQuestionDifficulty = useSheetStore((state) => state.setQuestionDifficulty);
  const assignTopicTagToQuestion = useSheetStore((state) => state.assignTopicTagToQuestion);
  const removeTopicTagFromQuestion = useSheetStore((state) => state.removeTopicTagFromQuestion);
  const createCustomTopicTag = useSheetStore((state) => state.createCustomTopicTag);
  const updateCustomTopicTag = useSheetStore((state) => state.updateCustomTopicTag);
  const deleteCustomTopicTag = useSheetStore((state) => state.deleteCustomTopicTag);

  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [subInput, setSubInput] = useState({});
  const [questionInput, setQuestionInput] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSubtopics, setExpandedSubtopics] = useState({});
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [mobileActionQuestionId, setMobileActionQuestionId] = useState(null);
  const [activeQuestionDrawer, setActiveQuestionDrawer] = useState(null);
  const [customModalQuestion, setCustomModalQuestion] = useState(null);
  const [customTopicModal, setCustomTopicModal] = useState({ open: false, editingTag: null, questionContext: null });
  const [customSaveError, setCustomSaveError] = useState("");
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const defaultDifficultyCategories = useMemo(() => difficultyCategories.filter((entry) => entry.type === "default" && entry.tier === "default"), [difficultyCategories]);
  const extraDifficultyCategories = useMemo(() => difficultyCategories.filter((entry) => entry.type === "default" && entry.tier === "extra"), [difficultyCategories]);
  const customDifficultyCategories = useMemo(() => difficultyCategories.filter((entry) => entry.type === "custom"), [difficultyCategories]);
  const normalizedQuery = normalizeText(searchQuery);
  const shouldExpandAll = Boolean(normalizedQuery);
  const visibleTopics = useMemo(() => (
    normalizedQuery
      ? topics
          .map((topic) => {
            const filteredSubTopics = topic.subTopics
              .map((sub) => {
                const filteredQuestions = sub.questions.filter((question) => {
                  const normalizedQuestion = normalizeText(question.text);
                  return onlyExactMatch
                    ? normalizedQuestion === normalizedQuery
                    : normalizedQuestion.includes(normalizedQuery);
                });

                return {
                  ...sub,
                  questions: filteredQuestions,
                };
              })
              .filter((sub) => sub.questions.length > 0);

            return {
              ...topic,
              subTopics: filteredSubTopics,
            };
          })
          .filter((topic) => topic.subTopics.length > 0)
      : topics
  ), [normalizedQuery, onlyExactMatch, topics]);

  const toggleTopic = (id) =>
    setExpandedTopics((current) => ({ ...current, [id]: !current[id] }));
  const toggleSubtopic = (id) =>
    setExpandedSubtopics((current) => ({ ...current, [id]: !current[id] }));

  const handleDragEnd = (result) => {
    if (!allowReorder || !isEditing) return;
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "topic") {
      if (source.index === destination.index) return;
      reorderTopics(source.index, destination.index);
      return;
    }

    if (type === "subtopic") {
      const fromTopicId = Number(source.droppableId.split("-")[1]);
      const toTopicId = Number(destination.droppableId.split("-")[1]);
      if (Number.isNaN(fromTopicId) || Number.isNaN(toTopicId)) return;
      moveSubTopic(fromTopicId, toTopicId, source.index, destination.index);
      return;
    }

    if (type === "question") {
      const fromTokens = source.droppableId.split("-");
      const toTokens = destination.droppableId.split("-");
      const fromTopicId = Number(fromTokens[1]);
      const fromSubId = Number(fromTokens[2]);
      const toTopicId = Number(toTokens[1]);
      const toSubId = Number(toTokens[2]);
      if ([fromTopicId, fromSubId, toTopicId, toSubId].some((value) => Number.isNaN(value))) return;
      moveQuestion(fromTopicId, fromSubId, toTopicId, toSubId, source.index, destination.index);
    }
  };

  const saveTopic = (topicId) => {
    editTopic(topicId, editValue);
    setEditingTopicId(null);
    setEditValue("");
  };

  const saveSubtopic = (topicId, subId) => {
    editSubTopic(topicId, subId, editValue);
    setEditingSubId(null);
    setEditValue("");
  };

  const saveQuestion = (topicId, subId, qId) => {
    editQuestion(topicId, subId, qId, editValue);
    setEditingQuestionId(null);
    setEditValue("");
  };

  const handleToggleProgress = (topicId, subId, question, topicTitle, subTopicTitle) => {
    if (!allowProgressToggle) {
      onRequireCopy?.();
      return;
    }
    setActiveAttempt({ topicId, subId, questionId: question.id, questionText: question.text, questionLink: question.link, topicName: topicTitle, subTopicName: subTopicTitle });
  };

  const startResourceEdit = (question, topicId, subId) => {
    setActiveQuestionDrawer({ question, topicId, subId });
  };



  useEffect(() => {
    if (!focusProblemId) return;
    const target = document.querySelector(`[data-problem-id="${focusProblemId}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("ring-2", "ring-[var(--accent-primary)]");
    const timer = window.setTimeout(() => target.classList.remove("ring-2", "ring-[var(--accent-primary)]"), 1800);
    return () => window.clearTimeout(timer);
  }, [focusProblemId, topics]);

  const handleDifficultyChange = async ({ topicId, subId, questionId, value }) => {
    if (value === "custom:new") {
      setCustomModalQuestion({ topicId, subId, questionId });
      setCustomSaveError("");
      return;
    }
    if (value.startsWith("default:")) {
      const key = value.replace("default:", "");
      const entry = difficultyCategories.find((category) => category.type === "default" && category.key === key) || DEFAULT_DIFFICULTY_CATEGORIES.find((category) => category.key === key);
      setQuestionDifficulty(topicId, subId, questionId, {
        difficultyKey: key,
        difficultyCategoryId: null,
        difficultyLabel: entry?.label || "Medium",
        difficultyColor: entry?.color || "#f59e0b",
      });
      return;
    }
    if (value.startsWith("custom:")) {
      const id = value.replace("custom:", "");
      const entry = difficultyCategories.find((category) => category.type === "custom" && category.id === id);
      if (!entry) return;
      setQuestionDifficulty(topicId, subId, questionId, {
        difficultyKey: null,
        difficultyCategoryId: id,
        difficultyLabel: entry.label,
        difficultyColor: entry.color,
      });
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="topics" type="topic">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-3"
            >
            {visibleTopics.map((topic, tIndex) => (
              (() => {
                const topicProgress = getTopicProgress(topic);
                const topicSegments = [
                  { key: "completed", count: topicProgress.completedSubtopics, color: ATTEMPT_RESULT_META.solved.color, label: "Completed subtopics" },
                  { key: "in_progress", count: topicProgress.inProgressSubtopics, color: ATTEMPT_RESULT_META.partially_solved.color, label: "In progress subtopics" },
                  { key: "not_started", count: topicProgress.notStartedSubtopics, color: ATTEMPT_RESULT_META.unresolved.color, label: "Not started subtopics" },
                ].filter((segment) => segment.count > 0);
                return (
              <Draggable
                key={topic.id}
                draggableId={`topic-${topic.id}`}
                index={tIndex}
                isDragDisabled={!isEditing || !allowReorder}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${!isEditing || !allowReorder ? "cursor-default" : "cursor-grab active:cursor-grabbing"} rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/70 px-3 py-2.5 transition hover:bg-[var(--surface-elevated)]/55`}
                  >
                    {/* Topic */}
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center">
                        <button
                          onClick={() => toggleTopic(topic.id)}
                          className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                        >
                          <span className={`text-xs transition ${expandedTopics[topic.id] ? "rotate-90" : ""}`}>▸</span>
                        </button>

                        {editingTopicId === topic.id && isEditing ? (
                          <div className="flex gap-2 flex-1">
                            <input
                              className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTopic(topic.id);
                              }}
                            />
                            <button
                              className="btn-base btn-success px-2 py-1 text-xs"
                              onClick={() => saveTopic(topic.id)}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-[var(--text-primary)] break-words">{topic.title}</h2>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {topicProgress.completedSubtopics} / {topicProgress.totalSubtopics} subtopics completed
                            </p>
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/70 p-1">
                          <button
                            className="rounded-md px-2 py-1 text-xs text-[var(--text-primary)] transition hover:bg-[var(--surface)]"
                            onClick={() => {
                              setEditingTopicId(topic.id);
                              setEditValue(topic.title);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-md px-2 py-1 text-xs text-[var(--danger-color)] transition hover:bg-[var(--danger-color)]/15"
                            onClick={() => deleteTopic(topic.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mb-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                        <div className="flex h-full w-full">
                          {topicProgress.totalSubtopics === 0 ? (
                            <span className="h-full w-full bg-[var(--surface-elevated)]" />
                          ) : (
                            topicSegments.map((segment) => (
                              <span
                                key={segment.key}
                                style={{ width: `${(segment.count / topicProgress.totalSubtopics) * 100}%`, background: segment.color }}
                                title={`${segment.label}: ${segment.count}/${topicProgress.totalSubtopics}`}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {(expandedTopics[topic.id] || shouldExpandAll) && (
                      <>
                        {isEditing && (
                          <div className="mb-2 mt-2 flex flex-wrap gap-2">
                            <input
                              placeholder="Add Subtopic"
                              className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                              value={subInput[topic.id] || ""}
                              onChange={(e) =>
                                setSubInput({ ...subInput, [topic.id]: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && subInput[topic.id]) {
                                  addSubTopic(topic.id, subInput[topic.id]).then((created) => {
                                    if (!created) return;
                                    setSubInput((current) => ({ ...current, [topic.id]: "" }));
                                  });
                                }
                              }}
                            />

                            <button
                              className="btn-base btn-primary rounded-md px-2.5 py-2 text-xs font-medium"
                              onClick={() => {
                                if (!subInput[topic.id]) return;
                                addSubTopic(topic.id, subInput[topic.id]).then((created) => {
                                  if (!created) return;
                                  setSubInput((current) => ({ ...current, [topic.id]: "" }));
                                });
                              }}
                            >
                              Add Subtopic
                            </button>
                          </div>
                        )}

                        <Droppable droppableId={`sub-${topic.id}`} type="subtopic">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2 pl-2 sm:pl-4"
                            >
                              {topic.subTopics.map((sub, sIndex) => (
                                (() => {
                                  const subtopicProgress = getSubtopicProgress(sub);
                                  const subtopicSegments = [
                                    { key: "solved", count: subtopicProgress.resultCounts.solved, color: ATTEMPT_RESULT_META.solved.color, label: ATTEMPT_RESULT_META.solved.label },
                                    { key: "partially_solved", count: subtopicProgress.resultCounts.partially_solved, color: ATTEMPT_RESULT_META.partially_solved.color, label: ATTEMPT_RESULT_META.partially_solved.label },
                                    { key: "failed", count: subtopicProgress.resultCounts.failed, color: ATTEMPT_RESULT_META.failed.color, label: ATTEMPT_RESULT_META.failed.label },
                                    { key: "unresolved", count: subtopicProgress.resultCounts.unresolved, color: ATTEMPT_RESULT_META.unresolved.color, label: ATTEMPT_RESULT_META.unresolved.label },
                                  ].filter((segment) => segment.count > 0);
                                  return (
                                <Draggable key={sub.id} draggableId={sub.id.toString()} index={sIndex} isDragDisabled={!isEditing || !allowReorder}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`${!isEditing || !allowReorder ? "cursor-default" : "cursor-grab active:cursor-grabbing"} rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]/60 py-1`}
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-3 p-2">
                                        <div className="flex min-w-0 flex-1 items-center">
                                          <button
                                            onClick={() => toggleSubtopic(sub.id)}
                                            className="mr-2 flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                                          >
                                            <span className={`text-xs transition ${expandedSubtopics[sub.id] ? "rotate-90" : ""}`}>▸</span>
                                          </button>

                                          {editingSubId === sub.id && isEditing ? (
                                            <div className="flex gap-2 flex-1">
                                              <input
                                                className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") saveSubtopic(topic.id, sub.id);
                                                }}
                                              />
                                              <button
                                                className="btn-base btn-success px-2 py-1 text-xs"
                                                onClick={() => saveSubtopic(topic.id, sub.id)}
                                              >
                                                Save
                                              </button>
                                            </div>
                                          ) : (
                                            <div className="min-w-0">
                                              <h3 className="text-sm font-medium text-[var(--text-primary)] break-words">{sub.title}</h3>
                                              <p className="text-xs text-[var(--text-secondary)]">
                                                {subtopicProgress.completedQuestions} / {subtopicProgress.totalQuestions} questions completed
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {isEditing && (
                                          <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/70 p-1">
                                            <button
                                              className="rounded-md px-2 py-1 text-xs text-[var(--text-primary)] transition hover:bg-[var(--surface)]"
                                              onClick={() => {
                                                setEditingSubId(sub.id);
                                                setEditValue(sub.title);
                                              }}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              className="rounded-md px-2 py-1 text-xs text-[var(--danger-color)] transition hover:bg-[var(--danger-color)]/15"
                                              onClick={() => deleteSubTopic(topic.id, sub.id)}
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <div className="px-2 pb-2">
                                        <div className="h-1.5 w-full overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                                          <div className="flex h-full w-full">
                                            {subtopicProgress.totalQuestions === 0 ? (
                                              <span className="h-full w-full bg-[var(--surface-elevated)]" />
                                            ) : (
                                              subtopicSegments.map((segment) => (
                                                <span
                                                  key={segment.key}
                                                  style={{ width: `${(segment.count / subtopicProgress.totalQuestions) * 100}%`, background: segment.color }}
                                                  title={`${segment.label}: ${segment.count}/${subtopicProgress.totalQuestions}`}
                                                />
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {(expandedSubtopics[sub.id] || shouldExpandAll) && (
                                        <>
                                          {isEditing && (
                                            <div className="mb-1 mt-1 flex flex-wrap gap-2">
                                              <input
                                                placeholder="Add Question"
                                                className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                                                value={questionInput[sub.id] || ""}
                                                onChange={(e) =>
                                                  setQuestionInput({
                                                    ...questionInput,
                                                    [sub.id]: e.target.value,
                                                  })
                                                }
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter" && questionInput[sub.id]) {
                                                    addQuestion(topic.id, sub.id, questionInput[sub.id]).then((created) => {
                                                      if (!created) return;
                                                      setQuestionInput((current) => ({ ...current, [sub.id]: "" }));
                                                    });
                                                  }
                                                }}
                                              />
                                              <button
                                                className="btn-base btn-success rounded-md px-2 py-2 text-xs"
                                                onClick={() => {
                                                  if (!questionInput[sub.id]) return;
                                                  addQuestion(topic.id, sub.id, questionInput[sub.id]).then((created) => {
                                                    if (!created) return;
                                                    setQuestionInput((current) => ({ ...current, [sub.id]: "" }));
                                                  });
                                                }}
                                              >
                                                Add Question
                                              </button>
                                            </div>
                                          )}

                                          <Droppable droppableId={`question-${topic.id}-${sub.id}`} type="question">
                                            {(provided) => (
                                              <ul
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="space-y-2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-2 py-2"
                                              >
                                                {sub.questions.map((q, qIndex) => (
                                                  
                                                  <Draggable
                                                    key={q.id}
                                                    draggableId={`question-${topic.id}-${sub.id}-${q.id}`}
                                                    index={qIndex}
                                                    isDragDisabled={!isEditing || !allowReorder}
                                                  >
                                                    {(provided) => (
                                                      (() => {
                                                        const attemptLogs = getQuestionAttemptLogs(q);
                                                        const totalAttempts = attemptLogs.length;
                                                        const latestResult = getLatestAttemptResult(q);
                                                        const tickMeta = ATTEMPT_RESULT_META[latestResult] || ATTEMPT_RESULT_META.unresolved;
                                                        const questionCompleted = isQuestionCompleted(q);
                                                        const isQuestionRevised = Boolean(q.revised);
                                                        const resultCounts = attemptLogs.reduce((acc, attempt) => {
                                                          if (!attempt?.result) return acc;
                                                          acc[attempt.result] = (acc[attempt.result] || 0) + 1;
                                                          return acc;
                                                        }, { failed: 0, partially_solved: 0, solved: 0 });
                                                        const barSegments = [
                                                          { key: "failed", count: resultCounts.failed, color: ATTEMPT_RESULT_META.failed.color },
                                                          { key: "partially_solved", count: resultCounts.partially_solved, color: ATTEMPT_RESULT_META.partially_solved.color },
                                                          { key: "solved", count: resultCounts.solved, color: ATTEMPT_RESULT_META.solved.color },
                                                        ].filter((segment) => segment.count > 0);
                                                        return (
                                                          <li
                                                            data-problem-id={String(q.id)}
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`${!isEditing || !allowReorder ? "cursor-default" : "cursor-grab active:cursor-grabbing"} rounded-md border border-[var(--border-subtle)] bg-[var(--surface)]/75 p-2.5 transition hover:bg-[var(--surface-elevated)]/60`}
                                                          >
                                                        {editingQuestionId === q.id && isEditing ? (
                                                          <div className="flex gap-2 flex-1">
                                                            <input
                                                              className="field-base flex-1 rounded-md px-2 py-1 text-sm"
                                                              value={editValue}
                                                              onChange={(e) => setEditValue(e.target.value)}
                                                              onKeyDown={(e) => {
                                                                if (e.key === "Enter") saveQuestion(topic.id, sub.id, q.id);
                                                              }}
                                                            />
                                                            <button
                                                              className="btn-base btn-success px-2 py-1 text-xs"
                                                              onClick={() => saveQuestion(topic.id, sub.id, q.id)}
                                                            >
                                                              Save
                                                            </button>
                                                          </div>
                                                        ) : (
                                                          <div className="w-full">
                                                            <div className="flex items-start justify-between gap-2">
                                                              <span className="flex flex-1 items-start gap-2">
                                                                <button
                                                                  type="button"
                                                                  onClick={() => handleToggleProgress(topic.id, sub.id, q, topic.title, sub.title)}
                                                                  className={`mt-0.5 h-5 w-5 rounded border text-xs font-bold transition ${showAttemptInsights
                                                                      ? tickMeta.tickClasses
                                                                      : (
                                                                        questionCompleted
                                                                          ? "border-[color-mix(in_srgb,var(--accent-success)_80%,black)] bg-[var(--accent-success)] text-[var(--btn-on-success)]"
                                                                          : "border-[var(--border-strong)] bg-transparent text-transparent"
                                                                      )
                                                                  } ${allowProgressToggle ? "question-done-toggle--open" : "cursor-pointer opacity-85"}`}
                                                                  aria-label={questionCompleted ? "Log another attempt" : "Log attempt"}
                                                                  title={showAttemptInsights ? tickMeta.label : (questionCompleted ? "Solved" : "Unsolved")}
                                                                >
                                                                  ✓
                                                                </button>
                                                              <span className="text-sm leading-5 text-[var(--text-primary)] break-words">{q.text}</span>
                                                              <DifficultyBadge question={q} difficultyCategories={difficultyCategories} />
                                                              {showAttemptInsights && isEditing ? (
                                                                <button
                                                                  type="button"
                                                                  className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs transition ${
                                                                    isQuestionRevised
                                                                      ? "border-[var(--accent-warning)] bg-[color-mix(in_srgb,var(--accent-warning)_18%,var(--surface-elevated))] text-[var(--accent-warning)]"
                                                                      : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--accent-warning)]"
                                                                  }`}
                                                                  title="Revised"
                                                                  aria-label={isQuestionRevised ? "Marked as revised" : "Mark as revised"}
                                                                  onClick={() => toggleQuestionRevised(topic.id, sub.id, q.id)}
                                                                >
                                                                  {isQuestionRevised ? "★" : "☆"}
                                                                </button>
                                                              ) : null}
                                                              </span>
                                                              {isEditing && (
                                                                <>
                                                                  <DifficultyCategorySelector
                                                                    value={buildCategoryValue(resolveQuestionDifficulty(q, difficultyCategories))}
                                                                    defaultCategories={defaultDifficultyCategories}
                                                                    extraCategories={extraDifficultyCategories}
                                                                    customCategories={customDifficultyCategories}
                                                                    onChange={(value) => handleDifficultyChange({ topicId: topic.id, subId: sub.id, questionId: q.id, value })}
                                                                  />
                                                                  <div className="hidden items-center gap-1 sm:flex">
                                                                    <button
                                                                      className="btn-base btn-neutral btn-sm rounded-md px-2 py-1 text-xs"
                                                                      onClick={() => {
                                                                        setEditingQuestionId(q.id);
                                                                        setEditValue(q.text);
                                                                      }}
                                                                    >
                                                                      Edit
                                                                    </button>
                                                                    <button
                                                                      className="btn-base btn-neutral btn-sm rounded-md px-2 py-1 text-xs"
                                                                      onClick={() => deleteQuestion(topic.id, sub.id, q.id)}
                                                                    >
                                                                      Delete
                                                                    </button>
                                                                    <button
                                                                      className="btn-base btn-neutral btn-sm rounded-md px-2 py-1 text-xs"
                                                                      onClick={() => startResourceEdit(q, topic.id, sub.id)}
                                                                    >
                                                                      Resources
                                                                    </button>
                                                                  </div>
                                                                  <button
                                                                    type="button"
                                                                    className="btn-base btn-neutral btn-sm rounded-md px-2 py-1 text-xs sm:hidden"
                                                                    onClick={() =>
                                                                      setMobileActionQuestionId((current) => (current === q.id ? null : q.id))
                                                                    }
                                                                  >
                                                                    Menu
                                                                  </button>
                                                                </>
                                                              )}
                                                            </div>

                                                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pl-3 sm:pl-7">
                                                              <TopicChipsPreview tags={topicTags.filter((tag) => (q.topicTagIds || []).includes(tag.id))} />
                                                              <button
                                                                type="button"
                                                                onClick={() => startResourceEdit(q, topic.id, sub.id)}
                                                                className="rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 py-1 text-[11px] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                                                              >
                                                                Resources
                                                              </button>
                                                            </div>
                                                            {isEditing ? <TopicTagSelector
                                                              question={q}
                                                              topicTags={topicTags}
                                                              readOnly={!isEditing}
                                                              onAssign={(tagId) => assignTopicTagToQuestion(topic.id, sub.id, q.id, tagId)}
                                                              onRemove={(tagId) => removeTopicTagFromQuestion(topic.id, sub.id, q.id, tagId)}
                                                              onAddCustom={() => setCustomTopicModal({ open: true, editingTag: null, questionContext: { topicId: topic.id, subId: sub.id, questionId: q.id } })}
                                                              onEditCustom={(tag) => setCustomTopicModal({ open: true, editingTag: tag, questionContext: { topicId: topic.id, subId: sub.id, questionId: q.id } })}
                                                              onDeleteCustom={(tag) => {
                                                                if (window.confirm(`Delete custom topic "${tag.name}"? It will be removed from all questions.`)) {
                                                                  deleteCustomTopicTag(tag.id);
                                                                }
                                                              }}
                                                            /> : null}

                                                            {showAttemptInsights && totalAttempts > 0 ? (
                                                              <div className="mt-2 pl-3 sm:pl-7">
                                                                <p className="text-[11px] text-[var(--text-tertiary)]">
                                                                  Attempts: {totalAttempts}
                                                                </p>
                                                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                                                                  <div className="flex h-full w-full">
                                                                    {barSegments.map((segment) => (
                                                                      <span
                                                                        key={segment.key}
                                                                        style={{ width: `${(segment.count / totalAttempts) * 100}%`, background: segment.color }}
                                                                        title={`${ATTEMPT_RESULT_META[segment.key].label}: ${segment.count}/${totalAttempts}`}
                                                                      />
                                                                    ))}
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            ) : null}

                                                            {isEditing && mobileActionQuestionId === q.id && (
                                                              <div className="mt-2 flex flex-wrap gap-1 pl-3 sm:hidden">
                                                                <button
                                                                  className="btn-base btn-neutral btn-sm rounded-md px-2 py-1 text-xs"
                                                                  onClick={() => {
                                                                    setEditingQuestionId(q.id);
                                                                    setEditValue(q.text);
                                                                    setMobileActionQuestionId(null);
                                                                  }}
                                                                >
                                                                  Edit
                                                                </button>
                                                                <button
                                                                  className="btn-base btn-neutral btn-sm rounded-md px-2 py-1 text-xs"
                                                                  onClick={() => {
                                                                    deleteQuestion(topic.id, sub.id, q.id);
                                                                    setMobileActionQuestionId(null);
                                                                  }}
                                                                >
                                                                  Delete
                                                                </button>
                                                                <button
                                                                  className="btn-base btn-neutral btn-sm rounded-md px-2 py-1 text-xs"
                                                                  onClick={() => startResourceEdit(q, topic.id, sub.id)}
                                                                >
                                                                  Resources
                                                                </button>
                                                              </div>
                                                            )}

                                                          </div>
                                                        )}
                                                      </li>
                                                        );
                                                      })()
                                                    )}
                                                  </Draggable>
                                                ))}
                                                {provided.placeholder}
                                              </ul>
                                            )}
                                          </Droppable>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                                  );
                                })()
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </>
                    )}
                  </div>
                )}
              </Draggable>
                );
              })()
            ))}
            {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {activeAttempt && (
        <AttemptLogModal
          questionText={activeAttempt.questionText}
          questionLink={activeAttempt.questionLink}
          topicName={activeAttempt.topicName}
          premiumActive={premiumActive}
          onPremiumLocked={() =>
            onPremiumLocked?.("Only result status is free. Unlock full attempt logging to learn faster with Premium.")
          }
          onClose={() => setActiveAttempt(null)}
          onSave={(attemptLog) => {
            updateQuestionAttempt(activeAttempt.topicId, activeAttempt.subId, activeAttempt.questionId, attemptLog);
            setActiveAttempt(null);
          }}
        />
      )}
      <CustomDifficultyModal
        open={Boolean(customModalQuestion)}
        isSaving={isSavingCustom}
        error={customSaveError}
        onClose={() => setCustomModalQuestion(null)}
        onSave={async ({ name, color }) => {
          if (!customModalQuestion || !onCreateCustomDifficulty) return;
          setIsSavingCustom(true);
          setCustomSaveError("");
          try {
            const created = await onCreateCustomDifficulty({ name, color });
            if (!created) return;
            setQuestionDifficulty(customModalQuestion.topicId, customModalQuestion.subId, customModalQuestion.questionId, {
              difficultyKey: null,
              difficultyCategoryId: created.id,
              difficultyLabel: created.label,
              difficultyColor: created.color,
            });
            setCustomModalQuestion(null);
          } catch (error) {
            setCustomSaveError(error?.message || "Unable to create custom category.");
          } finally {
            setIsSavingCustom(false);
          }
        }}
      />
      <CustomTopicModal
        open={customTopicModal.open}
        initialValue={customTopicModal.editingTag}
        existingColors={topicTags.map((entry) => entry.color)}
        onClose={() => setCustomTopicModal({ open: false, editingTag: null, questionContext: null })}
        onSave={({ name, color }) => {
          if (customTopicModal.editingTag) {
            updateCustomTopicTag(customTopicModal.editingTag.id, { name, color });
            setCustomTopicModal({ open: false, editingTag: null, questionContext: null });
            return;
          }
          createCustomTopicTag(name, color);
          const created = useSheetStore.getState().topicTags.at(-1);
          if (created?.id && customTopicModal.questionContext) {
            const { topicId, subId, questionId } = customTopicModal.questionContext;
            assignTopicTagToQuestion(topicId, subId, questionId, created.id);
          }
          setCustomTopicModal({ open: false, editingTag: null, questionContext: null });
        }}
      />
      <QuestionDetailsDrawer
        open={Boolean(activeQuestionDrawer)}
        question={activeQuestionDrawer?.question || null}
        questionContext={activeQuestionDrawer || null}
        onClose={() => setActiveQuestionDrawer(null)}
        readOnly={!isEditing}
        difficultyCategories={difficultyCategories}
        topicTags={topicTags}
        onSave={async ({ topicId, subId, questionId, payload }) => {
          updateQuestionResources(topicId, subId, questionId, payload);
        }}
      />
    </>
  );
}

export default TopicList;
