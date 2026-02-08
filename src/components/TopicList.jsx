import { useState } from "react";
import { useSheetStore } from "../store/sheetStore";

function TopicList() {
  const topics = useSheetStore((state) => state.topics);
  const addSubTopic = useSheetStore((state) => state.addSubTopic);
  const deleteTopic = useSheetStore((state) => state.deleteTopic);
  const editTopic = useSheetStore((state) => state.editTopic);

  const addQuestion = useSheetStore((state) => state.addQuestion);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [subInput, setSubInput] = useState({});
  const [questionInput, setQuestionInput] = useState({});

  const startEdit = (topic) => {
    setEditingId(topic.id);
    setEditValue(topic.title);
  };

  const saveEdit = (id) => {
    if (!editValue.trim()) return;
    editTopic(id, editValue);
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <div
          key={topic.id}
          className="p-4 bg-white border rounded shadow"
        >
          {/* Topic Title */}
          <div className="flex justify-between items-center mb-2">
            {editingId === topic.id ? (
              <div className="flex gap-2 flex-1">
                <input
                  className="border p-1 rounded flex-1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
                <button
                  className="px-2 py-1 bg-green-600 text-white rounded"
                  onClick={() => saveEdit(topic.id)}
                >
                  Save
                </button>
              </div>
            ) : (
              <h2 className="text-lg font-semibold flex-1">{topic.title}</h2>
            )}
            <div className="flex gap-2">
              <button
                className="px-2 py-1 bg-yellow-400 text-white rounded"
                onClick={() => startEdit(topic)}
              >
                Edit
              </button>
              <button
                className="px-2 py-1 bg-red-600 text-white rounded"
                onClick={() => deleteTopic(topic.id)}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Subtopic Input */}
          <div className="flex gap-2 mb-2">
            <input
              placeholder="Add Subtopic"
              className="border p-1 rounded flex-1"
              value={subInput[topic.id] || ""}
              onChange={(e) =>
                setSubInput({ ...subInput, [topic.id]: e.target.value })
              }
            />
            <button
              className="px-2 py-1 bg-blue-600 text-white rounded"
              onClick={() => {
                if (!subInput[topic.id]) return;
                addSubTopic(topic.id, subInput[topic.id]);
                setSubInput({ ...subInput, [topic.id]: "" });
              }}
            >
              Add Subtopic
            </button>
          </div>

          {/* Subtopics */}
          <div className="pl-4 space-y-2">
            {topic.subTopics.map((sub) => (
              <div key={sub.id} className="border-l pl-4">
                <h3 className="font-medium">{sub.title}</h3>

                {/* Question Input */}
                <div className="flex gap-2 mt-1 mb-1">
                  <input
                    placeholder="Add Question"
                    className="border p-1 rounded flex-1"
                    value={questionInput[sub.id] || ""}
                    onChange={(e) =>
                      setQuestionInput({
                        ...questionInput,
                        [sub.id]: e.target.value,
                      })
                    }
                  />
                  <button
                    className="px-2 py-1 bg-green-600 text-white rounded"
                    onClick={() => {
                      if (!questionInput[sub.id]) return;
                      addQuestion(topic.id, sub.id, questionInput[sub.id]);
                      setQuestionInput({ ...questionInput, [sub.id]: "" });
                    }}
                  >
                    Add Question
                  </button>
                </div>

                {/* Questions */}
                <ul className="pl-2 list-disc space-y-1">
                  {sub.questions.map((q) => (
                    <li key={q.id}>{q.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TopicList;
