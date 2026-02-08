import { useState } from "react";
import { useSheetStore } from "../store/sheetStore";

function TopicList() {
  const topics = useSheetStore((state) => state.topics);
  const editTopic = useSheetStore((state) => state.editTopic);
  const deleteTopic = useSheetStore((state) => state.deleteTopic);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

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
          className="p-4 bg-white border rounded shadow flex justify-between items-center"
        >
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

          {/* Buttons */}
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
      ))}
    </div>
  );
}

export default TopicList;
