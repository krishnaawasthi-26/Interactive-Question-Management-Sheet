import { useEffect, useState } from "react";
import { useSheetStore } from "./store/sheetStore";
import AddTopicForm from "./components/AddTopicForm";
import Header from "./components/Header";
import QuestionSearch from "./components/QuestionSearch";
import TopicList from "./components/TopicList";

function App() {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true); // toggle edit/view mode
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyExactMatch, setOnlyExactMatch] = useState(false);
  const addTopic = useSheetStore((state) => state.addTopic);
  const fetchSheetBySlug = useSheetStore((state) => state.fetchSheetBySlug);
  const isLoading = useSheetStore((state) => state.isLoading);
  const loadError = useSheetStore((state) => state.loadError);
  const loadSource = useSheetStore((state) => state.loadSource);
  const lastDeleted = useSheetStore((state) => state.lastDeleted);
  const undoDelete = useSheetStore((state) => state.undoDelete);
  const clearUndo = useSheetStore((state) => state.clearUndo);

  useEffect(() => {
    fetchSheetBySlug("striver-sde-sheet");
  }, [fetchSheetBySlug]);

  useEffect(() => {
    if (!lastDeleted) return;
    const timeoutId = window.setTimeout(() => {
      clearUndo();
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [lastDeleted, clearUndo]);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTopic(title);
    setTitle("");
  };

  const undoMessage = lastDeleted
    ? `Deleted ${
        lastDeleted.type === "subTopic"
          ? "subtopic"
          : lastDeleted.type === "question"
            ? "question"
            : "topic"
      }${
        lastDeleted.item?.title || lastDeleted.item?.text
          ? `: "${lastDeleted.item.title ?? lastDeleted.item.text}"`
          : ""
      }.`
    : "";

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

        <QuestionSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onlyExactMatch={onlyExactMatch}
          onExactMatchChange={setOnlyExactMatch}
        />

        {lastDeleted && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100">
            <span>{undoMessage}</span>
            <button
              className="rounded bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-900 transition hover:bg-white"
              onClick={undoDelete}
              type="button"
            >
              Undo
            </button>
          </div>
        )}

        {/* Main sheet / cards container */}
        <main>
          {(isLoading || loadError || loadSource !== "idle") && (
            <p className="mb-4 text-sm text-zinc-300">
              {isLoading
                ? "Loading sheet..."
                : loadError ||
                  (loadSource !== "remote"
                    ? "Showing local data."
                    : "Loaded from API.")}
            </p>
          )}
          {/* <TopicList isEditing={isEditing} /> pass editing state */}
          <TopicList
            isEditing={isEditing}
            searchQuery={searchQuery}
            onlyExactMatch={onlyExactMatch}
          />{" "}
          {/* pass editing state */}
        </main>
      </div>
    </div>
  );
}

export default App;