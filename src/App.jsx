import { useState } from "react";
import { useSheetStore } from "./store/sheetStore";
import TopicList from "./components/TopicList";

function App() {
  const [title, setTitle] = useState("");
  const addTopic = useSheetStore((state) => state.addTopic);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTopic(title);
    setTitle("");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold mb-6">
        Question Sheet
      </h1>

      {/* Add Topic */}
      <div className="flex gap-2 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter topic name"
          className="border p-2 rounded w-64"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Topic
        </button>
      </div>

      {/* Topic List */}
      <TopicList />
    </div>
  );
}

export default App;
