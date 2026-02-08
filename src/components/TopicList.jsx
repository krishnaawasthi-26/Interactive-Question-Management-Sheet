import { useState } from "react";
import { useSheetStore } from "../store/sheetStore";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

function TopicList() {
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

  const toggleTopic = (id) => setExpandedTopics({ ...expandedTopics, [id]: !expandedTopics[id] });
  const toggleSubtopic = (id) => setExpandedSubtopics({ ...expandedSubtopics, [id]: !expandedSubtopics[id] });

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
      moveQuestion(parseInt(fromTopicId), parseInt(fromSubId), parseInt(toTopicId), parseInt(toSubId), source.index, destination.index);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="topics" type="topic">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
            {topics.map((topic, tIndex) => (
              <Draggable key={topic.id} draggableId={topic.id.toString()} index={tIndex}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="p-4 bg-white border rounded shadow">
                    {/* Topic */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center flex-1">
                        <button onClick={() => toggleTopic(topic.id)} className="mr-2 px-1 py-0.5 bg-gray-300 rounded">{expandedTopics[topic.id] ? "-" : "+"}</button>
                        {editingTopicId === topic.id ? (
                          <div className="flex gap-2 flex-1">
                            <input className="border p-1 rounded flex-1" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                            <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => { editTopic(topic.id, editValue); setEditingTopicId(null); setEditValue(""); }}>Save</button>
                          </div>
                        ) : (
                          <h2 className="text-lg font-semibold">{topic.title}</h2>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-2 py-1 bg-yellow-400 text-white rounded" onClick={() => { setEditingTopicId(topic.id); setEditValue(topic.title); }}>Edit</button>
                        <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteTopic(topic.id)}>Delete</button>
                      </div>
                    </div>

                    {expandedTopics[topic.id] && (
                      <>
                        {/* Add Subtopic */}
                        <div className="flex gap-2 mb-2">
                          <input placeholder="Add Subtopic" className="border p-1 rounded flex-1" value={subInput[topic.id] || ""} onChange={(e) => setSubInput({ ...subInput, [topic.id]: e.target.value })} />
                          <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => { if (!subInput[topic.id]) return; addSubTopic(topic.id, subInput[topic.id]); setSubInput({ ...subInput, [topic.id]: "" }); }}>Add Subtopic</button>
                        </div>

                        {/* Subtopics */}
                        <Droppable droppableId={`sub-${topic.id}`} type="subtopic">
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="pl-4 space-y-2">
                              {topic.subTopics.map((sub, sIndex) => (
                                <Draggable key={sub.id} draggableId={sub.id.toString()} index={sIndex}>
                                  {(provided) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="border-l pl-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center flex-1">
                                          <button onClick={() => toggleSubtopic(sub.id)} className="mr-2 px-1 py-0.5 bg-gray-300 rounded">{expandedSubtopics[sub.id] ? "-" : "+"}</button>
                                          {editingSubId === sub.id ? (
                                            <div className="flex gap-2 flex-1">
                                              <input className="border p-1 rounded flex-1" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                                              <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => { editSubTopic(topic.id, sub.id, editValue); setEditingSubId(null); setEditValue(""); }}>Save</button>
                                            </div>
                                          ) : (
                                            <h3 className="font-medium">{sub.title}</h3>
                                          )}
                                        </div>
                                        <div className="flex gap-2">
                                          <button className="px-2 py-1 bg-yellow-400 text-white rounded" onClick={() => { setEditingSubId(sub.id); setEditValue(sub.title); }}>Edit</button>
                                          <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteSubTopic(topic.id, sub.id)}>Delete</button>
                                        </div>
                                      </div>

                                      {expandedSubtopics[sub.id] && (
                                        <>
                                          {/* Add Question */}
                                          <div className="flex gap-2 mt-1 mb-1">
                                            <input placeholder="Add Question" className="border p-1 rounded flex-1" value={questionInput[sub.id] || ""} onChange={(e) => setQuestionInput({ ...questionInput, [sub.id]: e.target.value })} />
                                            <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => { if (!questionInput[sub.id]) return; addQuestion(topic.id, sub.id, questionInput[sub.id]); setQuestionInput({ ...questionInput, [sub.id]: "" }); }}>Add Question</button>
                                          </div>

                                          {/* Questions */}
                                          <Droppable droppableId={`question-${topic.id}-${sub.id}`} type="question">
                                            {(provided) => (
                                              <ul ref={provided.innerRef} {...provided.droppableProps} className="pl-2 list-disc space-y-1">
                                                {sub.questions.map((q, qIndex) => (
                                                  <Draggable key={q.id} draggableId={q.id.toString()} index={qIndex}>
                                                    {(provided) => (
                                                      <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="flex justify-between items-center">
                                                        <span className="flex-1">{q.link ? <a href={q.link} target="_blank" className="text-blue-600 underline">{q.text}</a> : q.text}</span>
                                                        <div className="flex gap-1">
                                                          <button className="px-1 py-0.5 bg-yellow-400 text-white rounded" onClick={() => { setEditingQuestionId(q.id); setEditValue(q.text); editQuestion(topic.id, sub.id, q.id, editValue); }}>Edit</button>
                                                          <button className="px-1 py-0.5 bg-red-600 text-white rounded" onClick={() => deleteQuestion(topic.id, sub.id, q.id)}>Delete</button>
                                                          <button className="px-1 py-0.5 bg-blue-600 text-white rounded" onClick={() => { const link = prompt("Enter link:", q.link || ""); if (link !== null) addLinkToQuestion(topic.id, sub.id, q.id, link); }}>Add Link</button>
                                                        </div>
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
