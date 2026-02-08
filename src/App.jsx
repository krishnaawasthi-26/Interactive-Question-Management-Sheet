import { useState } from "react";
import { useSheetStore } from "./store/sheetStore";
import TopicList from "./components/TopicList";

function App() {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true); // toggle edit/view mode
  const addTopic = useSheetStore((state) => state.addTopic);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTopic(title);
    setTitle("");
  };

  return (
    // Page background + global text color
    <div className="min-h-screen [background-color:rgb(24_24_27/var(--tw-bg-opacity,1))] text-white">
      {/* Centered content */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Logo placeholder */}
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center font-bold text-black">
              C
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Question Sheet</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Edit/View Mode Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 rounded-md text-sm border border-gray-700 text-gray-200 hover:bg-gray-800 transition"
            >
              {isEditing ? "View Only" : "Edit Sheet"}
            </button>

            {/* <button className="px-3 py-1 rounded-md bg-orange-600 hover:bg-orange-700 text-white text-sm transition">
              Sign in
            </button> */}
          </div>
        </header>

        {/* Add Topic area — only show in edit mode */}
        {isEditing && (
          <div className="bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Enter topic name"
                className="border p-2 rounded w-64 bg-transparent text-white placeholder-gray-400"
              />

              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md shadow-sm transition"
              >
                Add Topic
              </button>
            </div>
          </div>
        )}

        {/* Main sheet / cards container */}
        <main>
          <TopicList isEditing={isEditing} /> {/* pass editing state */}
        </main>
      </div>
    </div>
  );
}

export default App;
