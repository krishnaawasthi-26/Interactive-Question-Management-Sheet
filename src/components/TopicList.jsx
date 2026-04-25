import { useEffect, useMemo, useState } from "react";
import { useSheetStore } from "../store/sheetStore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AttemptLogModal from "./AttemptLogModal";

const normalizeText = (value) =>
  `${value || ""}`.trim().toLowerCase().replace(/\s+/g, " ");

function TopicList({
  isEditing = true,
  searchQuery = "",
  onlyExactMatch = false,
  allowProgressToggle = true,
  allowReorder = true,
  focusProblemId = null,
  premiumActive = false,
  onPremiumLocked,
  onRequireCopy,
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
  const reorderTopics = useSheetStore((state) => state.reorderTopics);
  const moveSubTopic = useSheetStore((state) => state.moveSubTopic);
  const moveQuestion = useSheetStore((state) => state.moveQuestion);
  const toggleQuestionDone = useSheetStore((state) => state.toggleQuestionDone);
  const updateQuestionAttempt = useSheetStore((state) => state.updateQuestionAttempt);

  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [subInput, setSubInput] = useState({});
  const [questionInput, setQuestionInput] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSubtopics, setExpandedSubtopics] = useState({});
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [resourceEditorByQuestion, setResourceEditorByQuestion] = useState({});
  const [resourceDraftByQuestion, setResourceDraftByQuestion] = useState({});
  const [mobileActionQuestionId, setMobileActionQuestionId] = useState(null);
  const [activeNotesPreview, setActiveNotesPreview] = useState(null);
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
      reorderTopics(source.index, destination.index);
    } else if (type === "subtopic") {
      const fromTopicId = parseInt(source.droppableId.split("-")[1]);
      const toTopicId = parseInt(destination.droppableId.split("-")[1]);
      moveSubTopic(fromTopicId, toTopicId, source.index, destination.index);
    } else if (type === "question") {
      const [_, fromTopicId, fromSubId] = source.droppableId.split("-");
      const [__, toTopicId, toSubId] = destination.droppableId.split("-");
      moveQuestion(
        parseInt(fromTopicId),
        parseInt(fromSubId),
        parseInt(toTopicId),
        parseInt(toSubId),
        source.index,
        destination.index
      );
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
    if (question.done) {
      toggleQuestionDone(topicId, subId, question.id);
      return;
    }
    setActiveAttempt({ topicId, subId, questionId: question.id, questionText: question.text, questionLink: question.link, topicName: topicTitle, subTopicName: subTopicTitle });
  };

  const startResourceEdit = (question) => {
    setResourceEditorByQuestion((current) => ({ ...current, [question.id]: true }));
    setResourceDraftByQuestion((current) => ({
      ...current,
      [question.id]: {
        link: question.link || "",
        articleLink: question.articleLink || "",
        videoLink: question.videoLink || "",
        notes: question.notes || "",
      },
    }));
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

  const saveResourceEdit = (topicId, subId, questionId) => {
    const draft = resourceDraftByQuestion[questionId];
    if (!draft) return;
    updateQuestionResources(topicId, subId, questionId, draft);
    setResourceEditorByQuestion((current) => ({ ...current, [questionId]: false }));
    setMobileActionQuestionId(null);
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
              <Draggable
                key={topic.id}
                draggableId={topic.id.toString()}
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
                          <h2 className="text-sm font-semibold text-[var(--text-primary)] break-words">{topic.title}</h2>
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
                                            <h3 className="text-sm font-medium text-[var(--text-primary)] break-words">{sub.title}</h3>
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
                                                  <Draggable key={q.id} draggableId={q.id.toString()} index={qIndex} isDragDisabled={!isEditing || !allowReorder}>
                                                    {(provided) => (
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
                                                                  className={`mt-0.5 h-5 w-5 rounded border text-xs font-bold transition ${
                                                                    q.done
                                                                      ? "border-[color-mix(in_srgb,var(--accent-success)_80%,black)] bg-[var(--accent-success)] text-[var(--btn-on-success)]"
                                                                      : "border-[var(--border-strong)] bg-transparent text-transparent"
                                                                  } ${allowProgressToggle ? "question-done-toggle--open" : "cursor-pointer opacity-85"}`}
                                                                  aria-label={q.done ? "Mark as not done" : "Mark as done"}
                                                                  title={q.done ? "Solved" : "Unsolved"}
                                                                >
                                                                  ✓
                                                                </button>
                                                              <span className="text-sm leading-5 text-[var(--text-primary)] break-words">{q.text}</span>
                                                              </span>
                                                              {isEditing && (
                                                                <>
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
                                                                      onClick={() => startResourceEdit(q)}
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

                                                            {(q.link || q.articleLink || q.videoLink || q.notes) && (
                                                              <div className="mt-2 flex flex-wrap items-center gap-2 pl-3 text-[11px] sm:pl-7">
                                                                {q.link && <a href={q.link} target="_blank" rel="noreferrer" className="rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 py-1 text-[var(--text-muted)]">Link</a>}
                                                                {q.articleLink && <a href={q.articleLink} target="_blank" rel="noreferrer" className="rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 py-1 text-[var(--text-muted)]">Article</a>}
                                                                {q.videoLink && <a href={q.videoLink} target="_blank" rel="noreferrer" className="rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 py-1 text-[var(--text-muted)]">Video</a>}
                                                                {q.notes && (
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => setActiveNotesPreview({ questionText: q.text, notes: q.notes })}
                                                                    className="rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 py-1 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                                                                  >
                                                                    Notes
                                                                  </button>
                                                                )}
                                                              </div>
                                                            )}

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
                                                                  onClick={() => startResourceEdit(q)}
                                                                >
                                                                  Resources
                                                                </button>
                                                              </div>
                                                            )}

                                                            {isEditing && resourceEditorByQuestion[q.id] && (
                                                              <div className="mt-3 space-y-2 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3 pl-3 sm:pl-7">
                                                                <input
                                                                  value={resourceDraftByQuestion[q.id]?.link || ""}
                                                                  onChange={(event) =>
                                                                    setResourceDraftByQuestion((current) => ({
                                                                      ...current,
                                                                      [q.id]: { ...current[q.id], link: event.target.value },
                                                                    }))
                                                                  }
                                                                  placeholder="Problem link"
                                                                  className="field-base w-full rounded-md px-2 py-1 text-sm"
                                                                />
                                                                <input
                                                                  value={resourceDraftByQuestion[q.id]?.articleLink || ""}
                                                                  onChange={(event) =>
                                                                    setResourceDraftByQuestion((current) => ({
                                                                      ...current,
                                                                      [q.id]: { ...current[q.id], articleLink: event.target.value },
                                                                    }))
                                                                  }
                                                                  placeholder="Article link"
                                                                  className="field-base w-full rounded-md px-2 py-1 text-sm"
                                                                />
                                                                <input
                                                                  value={resourceDraftByQuestion[q.id]?.videoLink || ""}
                                                                  onChange={(event) =>
                                                                    setResourceDraftByQuestion((current) => ({
                                                                      ...current,
                                                                      [q.id]: { ...current[q.id], videoLink: event.target.value },
                                                                    }))
                                                                  }
                                                                  placeholder="Video link"
                                                                  className="field-base w-full rounded-md px-2 py-1 text-sm"
                                                                />
                                                                <textarea
                                                                  value={resourceDraftByQuestion[q.id]?.notes || ""}
                                                                  onChange={(event) =>
                                                                    setResourceDraftByQuestion((current) => ({
                                                                      ...current,
                                                                      [q.id]: { ...current[q.id], notes: event.target.value },
                                                                    }))
                                                                  }
                                                                  placeholder="Notes"
                                                                  className="field-base w-full rounded-md px-2 py-1 text-sm"
                                                                  rows={3}
                                                                />
                                                                <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/70 p-1">
                                                                  <button
                                                                    className="btn-base btn-success btn-sm rounded-md px-2 py-1 text-xs"
                                                                    onClick={() => saveResourceEdit(topic.id, sub.id, q.id)}
                                                                  >
                                                                    Save resources
                                                                  </button>
                                                                  <button
                                                                    className="btn-base btn-neutral btn-sm rounded-md px-2 py-1 text-xs"
                                                                    onClick={() =>
                                                                      setResourceEditorByQuestion((current) => ({ ...current, [q.id]: false }))
                                                                    }
                                                                  >
                                                                    Cancel
                                                                  </button>
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                      </li>
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
      {activeNotesPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] p-5 shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Problem Notes</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{activeNotesPreview.questionText}</p>
            </div>
            <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-primary)]">
              {activeNotesPreview.notes}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveNotesPreview(null)}
                className="btn-base btn-neutral px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopicList;
