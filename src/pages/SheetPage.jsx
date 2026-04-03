import { useEffect, useState } from "react";
import AddTopicForm from "../components/AddTopicForm";
import Header from "../components/Header";
import QuestionSearch from "../components/QuestionSearch";
import TopicList from "../components/TopicList";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { navigateTo, ROUTES } from "../services/hashRouter";

function SheetPage({ sheetId, onOpenImport, onOpenExport, onLogout, onBackProfile }) {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = useAuthStore((state) => state.currentUser);
  const addTopic = useSheetStore((state) => state.addTopic);
  const createNewSheet = useSheetStore((state) => state.createNewSheet);
  const loadSheetById = useSheetStore((state) => state.loadSheetById);
  const persistCurrentSheet = useSheetStore((state) => state.persistCurrentSheet);
  const isLoading = useSheetStore((state) => state.isLoading);
  const loadError = useSheetStore((state) => state.loadError);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const topics = useSheetStore((state) => state.topics);

  useEffect(() => {
    if (!sheetId || !currentUser?.token) return;
    loadSheetById(currentUser.token, sheetId);
  }, [sheetId, loadSheetById, currentUser?.token]);

  useEffect(() => {
    if (!sheetId || !currentUser?.token) return;
    const timeout = setTimeout(() => {
      persistCurrentSheet(currentUser.token);
    }, 500);
    return () => clearTimeout(timeout);
  }, [topics, sheetTitle, persistCurrentSheet, currentUser?.token, sheetId]);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTopic(title);
    setTitle("");
  };

  const handleCreateNewSheet = async () => {
    if (!currentUser?.token) return;
    const created = await createNewSheet(currentUser.token, "Untitled Sheet");
    navigateTo(`${ROUTES.APP}/${created.id}`);
  };

  return (
    <div className="min-h-screen [background-color:rgb(24_24_27/var(--tw-bg-opacity,1))] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Header
          title={sheetTitle}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((value) => !value)}
          onOpenImport={onOpenImport}
          onOpenExport={onOpenExport}
          onCreateNewSheet={handleCreateNewSheet}
          onLogout={onLogout}
          onBackProfile={onBackProfile}
        />

        {isEditing && (
          <AddTopicForm title={title} onTitleChange={(e) => setTitle(e.target.value)} onAdd={handleAdd} />
        )}

        <QuestionSearch value={searchQuery} onChange={setSearchQuery} />

        <main>
          {(isLoading || loadError) && (
            <p className="mb-4 text-sm text-zinc-300">{isLoading ? "Loading sheet..." : loadError}</p>
          )}
          <TopicList isEditing={isEditing} searchQuery={searchQuery} />
        </main>
      </div>
    </div>
  );
}

export default SheetPage;
