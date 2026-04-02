import { useEffect, useState } from "react";
import AddTopicForm from "../components/AddTopicForm";
import Header from "../components/Header";
import QuestionSearch from "../components/QuestionSearch";
import TopicList from "../components/TopicList";
import { useSheetStore } from "../store/sheetStore";

function SheetPage({ onOpenImport, onLogout }) {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const addTopic = useSheetStore((state) => state.addTopic);
  const fetchSheetBySlug = useSheetStore((state) => state.fetchSheetBySlug);
  const isLoading = useSheetStore((state) => state.isLoading);
  const loadError = useSheetStore((state) => state.loadError);
  const loadSource = useSheetStore((state) => state.loadSource);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);

  useEffect(() => {
    fetchSheetBySlug("striver-sde-sheet");
  }, [fetchSheetBySlug]);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTopic(title);
    setTitle("");
  };

  return (
    <div className="min-h-screen [background-color:rgb(24_24_27/var(--tw-bg-opacity,1))] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Header
          title={sheetTitle}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((value) => !value)}
          onOpenImport={onOpenImport}
          onLogout={onLogout}
        />

        {isEditing && (
          <AddTopicForm
            title={title}
            onTitleChange={(e) => setTitle(e.target.value)}
            onAdd={handleAdd}
          />
        )}

        <QuestionSearch value={searchQuery} onChange={setSearchQuery} />

        <main>
          {(isLoading || loadError || loadSource !== "idle") && (
            <p className="mb-4 text-sm text-zinc-300">
              {isLoading
                ? "Loading sheet..."
                : loadError ||
                  (loadSource !== "remote" ? "Showing local data." : "Loaded from API.")}
            </p>
          )}

          <TopicList isEditing={isEditing} searchQuery={searchQuery} />
        </main>
      </div>
    </div>
  );
}

export default SheetPage;
