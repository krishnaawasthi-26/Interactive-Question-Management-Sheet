import { useState } from "react";
import { useSheetStore } from "../store/sheetStore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function TopicList({ isEditing = true, searchQuery = "", onlyExactMatch = false }) {
  const topics = useSheetStore((state) => state.topics);
  const addSubTopic = useSheetStore((state) => state.addSubTopic);
  const addQuestion = useSheetStore((state) => state.addQuestion);
  const editTopic = useSheetStore((state) => state.editTopic);
  const deleteTopic = useSheetStore((state) => state.deleteTopic);
  const editSubTopic = useSheetStore((state) => state.editSubTopic);
  const deleteSubTopic = useSheetStore((state) => state.deleteSubTopic);
  const editQuestion = useSheetStore((state) => state.editQuestion);
  const deleteQuestion = useSheetStore((state) => state.deleteQuestion);
  const addLinkToQuestion = useSheetStore((state) => state.addLinkToQuestion);
  const reorderTopics = useSheetStore((state) => state.reorderTopics);
  const moveSubTopic = useSheetStore((state) => state.moveSubTopic);
  const moveQuestion = useSheetStore((state) => state.moveQuestion);

  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [subInput, setSubInput] = useState({});
  const [questionInput, setQuestionInput] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSubtopics, setExpandedSubtopics] = useState({});
 const normalizeText = (value) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");
  const normalizedQuery = normalizeText(searchQuery);
  const shouldExpandAll = Boolean(normalizedQuery);
  const visibleTopics = normalizedQuery
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
    : topics;

  const toggleTopic = (id) =>
    setExpandedTopics({ ...expandedTopics, [id]: !expandedTopics[id] });
  const toggleSubtopic = (id) =>
    setExpandedSubtopics({ ...expandedSubtopics, [id]: !expandedSubtopics[id] });

  const handleDragEnd = (result) => {
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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="topics" type="topic">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-4"
          >
            {visibleTopics.map((topic, tIndex) => (
              <Draggable
                key={topic.id}
                draggableId={topic.id.toString()}
                index={tIndex}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="p-4 rounded-xl shadow-sm border border-gray-800 bg-[rgba(255,255,255,0.03)]"
                  >
                    {/* Topic */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center flex-1">
                        <button
                          onClick={() => toggleTopic(topic.id)}
                          className="mr-2 px-2 py-1 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] rounded text-indigo-100 transition"
                        >
                          {expandedTopics[topic.id] ? "-" : "+"}
                        </button>

                        {editingTopicId === topic.id && isEditing ? (
                          <div className="flex gap-2 flex-1">
                            <input
                              className="border border-gray-700 px-2 py-1 rounded-md flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTopic(topic.id);
                              }}
                            />
                            <button
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
                              onClick={() => saveTopic(topic.id)}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <h2 className="text-lg font-semibold">{topic.title}</h2>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm transition"
                            onClick={() => {
                              setEditingTopicId(topic.id);
                              setEditValue(topic.title);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition"
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
                          <div className="flex gap-2 mb-2">
                            <input
                              placeholder="Add Subtopic"
                              className="flex-1 bg-transparent border border-gray-700 px-2 py-1 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              value={subInput[topic.id] || ""}
                              onChange={(e) =>
                                setSubInput({ ...subInput, [topic.id]: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && subInput[topic.id]) {
                                  addSubTopic(topic.id, subInput[topic.id]);
                                  setSubInput({ ...subInput, [topic.id]: "" });
                                }
                              }}
                            />

                            <button
                              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition"
                              onClick={() => {
                                if (!subInput[topic.id]) return;
                                addSubTopic(topic.id, subInput[topic.id]);
                                setSubInput({ ...subInput, [topic.id]: "" });
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
                              className="pl-4 space-y-2"
                            >
                              {topic.subTopics.map((sub, sIndex) => (
                                <Draggable key={sub.id} draggableId={sub.id.toString()} index={sIndex}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="border-l-4 py-2 rounded-md bg-[rgba(255,255,255,0.02)] border-gray-500"
                                    >
                                      <div className="flex items-center justify-between p-3">
                                        <div className="flex items-center flex-1">
                                          <button
                                            onClick={() => toggleSubtopic(sub.id)}
                                            className="mr-2 px-2 py-1 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] rounded text-indigo-100 transition"
                                          >
                                            {expandedSubtopics[sub.id] ? "-" : "+"}
                                          </button>

                                          {editingSubId === sub.id && isEditing ? (
                                            <div className="flex gap-2 flex-1">
                                              <input
                                                className="border border-gray-700 px-2 py-1 rounded-md flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") saveSubtopic(topic.id, sub.id);
                                                }}
                                              />
                                              <button
                                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
                                                onClick={() => saveSubtopic(topic.id, sub.id)}
                                              >
                                                Save
                                              </button>
                                            </div>
                                          ) : (
                                            <h3 className="font-medium">{sub.title}</h3>
                                          )}
                                        </div>

                                        {isEditing && (
                                          <div className="flex gap-2">
                                            <button
                                              className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm transition"
                                              onClick={() => {
                                                setEditingSubId(sub.id);
                                                setEditValue(sub.title);
                                              }}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition"
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
                                            <div className="flex gap-2 mt-1 mb-1">
                                              <input
                                                placeholder="Add Question"
                                                className="flex-1 bg-transparent border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                value={questionInput[sub.id] || ""}
                                                onChange={(e) =>
                                                  setQuestionInput({
                                                    ...questionInput,
                                                    [sub.id]: e.target.value,
                                                  })
                                                }
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter" && questionInput[sub.id]) {
                                                    addQuestion(topic.id, sub.id, questionInput[sub.id]);
                                                    setQuestionInput({ ...questionInput, [sub.id]: "" });
                                                  }
                                                }}
                                              />
                                              <button
                                                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
                                                onClick={() => {
                                                  if (!questionInput[sub.id]) return;
                                                  addQuestion(topic.id, sub.id, questionInput[sub.id]);
                                                  setQuestionInput({ ...questionInput, [sub.id]: "" });
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
                                                className="pl-6 py-2 rounded-md bg-[rgba(74,33,33,0.09)] border-gray-500"
                                              >
                                                {sub.questions.map((q, qIndex) => (
                                                  <Draggable key={q.id} draggableId={q.id.toString()} index={qIndex}>
                                                    {(provided) => (
                                                      <li
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="flex justify-between items-center mb-1 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.03)] borderrounded border-t-3 border-l border-r border-b border-gray-500 p-2 rounded-md"
                                                      >
                                                        {editingQuestionId === q.id && isEditing ? (
                                                          <div className="flex gap-2 flex-1">
                                                            <input
                                                              className="border border-gray-700 px-2 py-1 rounded-md flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                              value={editValue}
                                                              onChange={(e) => setEditValue(e.target.value)}
                                                              onKeyDown={(e) => {
                                                                if (e.key === "Enter") saveQuestion(topic.id, sub.id, q.id);
                                                              }}
                                                            />
                                                            <button
                                                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
                                                              onClick={() => saveQuestion(topic.id, sub.id, q.id)}
                                                            >
                                                              Save
                                                            </button>
                                                          </div>
                                                        ) : (
                                                          <span className="flex-1">
                                                            {q.link ? (
                                                              <a href={q.link} target="_blank" className="text-blue-500 underline">
                                                                {q.text}
                                                              </a>
                                                            ) : (
                                                              q.text
                                                            )}
                                                          </span>
                                                        )}

                                                        {isEditing && (
                                                          <div className="flex gap-1">
                                                            <button
                                                              className="px-2 py-0.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition"
                                                              onClick={() => {
                                                                setEditingQuestionId(q.id);
                                                                setEditValue(q.text);
                                                              }}
                                                            >
                                                              Edit
                                                            </button>
                                                            <button
                                                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                                                              onClick={() => deleteQuestion(topic.id, sub.id, q.id)}
                                                            >
                                                              Delete
                                                            </button>
                                                            <button
                                                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                                                              onClick={() => {
                                                                const link = prompt("Enter link:", q.link || "");
                                                                if (link !== null) addLinkToQuestion(topic.id, sub.id, q.id, link);
                                                              }}
                                                            >
                                                              Add Link
                                                            </button>
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
  );
}

export default TopicList;
