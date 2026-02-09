import { useEffect, useState } from "react";
import { useSheetStore } from "./store/sheetStore";
import AddTopicForm from "./components/AddTopicForm";
import Header from "./components/Header";
import TopicList from "./components/TopicList";

function App() {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true); // toggle edit/view mode
  const addTopic = useSheetStore((state) => state.addTopic);
  const fetchSheetBySlug = useSheetStore((state) => state.fetchSheetBySlug);
  const isLoading = useSheetStore((state) => state.isLoading);
  const loadError = useSheetStore((state) => state.loadError);
  const hasLoaded = useSheetStore((state) => state.hasLoaded);

  useEffect(() => {
    fetchSheetBySlug("striver-sde-sheet");
  }, [fetchSheetBySlug]);

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
        <Header
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
        />

        {/* Add Topic area — only show in edit mode */}
        {isEditing && (
          <AddTopicForm
            title={title}
            onTitleChange={(e) => setTitle(e.target.value)}
            onAdd={handleAdd}
          />
        )}

        {/* Main sheet / cards container */}
        <main>
          {(isLoading || loadError || hasLoaded) && (
            <p className="mb-4 text-sm text-zinc-300">
              {isLoading
                ? "Loading sheet..."
                : loadError
                  ? "Failed to load API, showing local data."
                  : "Sheet loaded successfully."}
            </p>
          )}
          <TopicList isEditing={isEditing} /> {/* pass editing state */}
        </main>
      </div>
    </div>
  );
}

export default App;