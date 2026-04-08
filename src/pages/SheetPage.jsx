import { useEffect, useState } from "react";
import AddTopicForm from "../components/AddTopicForm";
import Header from "../components/Header";
import QuestionSearch from "../components/QuestionSearch";
import SheetDashboardView from "../components/SheetDashboardView";
import TopicList from "../components/TopicList";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { navigateTo, ROUTES } from "../services/hashRouter";

function SheetPage({ sheetId, onOpenImport, onOpenExport, onLogout, onBackProfile }) {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("light");

  const currentUser = useAuthStore((state) => state.currentUser);
  const addTopic = useSheetStore((state) => state.addTopic);
  const createNewSheet = useSheetStore((state) => state.createNewSheet);
  const loadSheetById = useSheetStore((state) => state.loadSheetById);
  const persistCurrentSheet = useSheetStore((state) => state.persistCurrentSheet);
  const isLoading = useSheetStore((state) => state.isLoading);
  const loadError = useSheetStore((state) => state.loadError);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const setSheetTitle = useSheetStore((state) => state.setSheetTitle);
  const topics = useSheetStore((state) => state.topics);
  const limitWarning = useSheetStore((state) => state.limitWarning);
  const clearLimitWarning = useSheetStore((state) => state.clearLimitWarning);

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
    addTopic(title).then((created) => {
      if (created) setTitle("");
    });
  };

  const handleCreateNewSheet = async () => {
    if (!currentUser?.token) return;
    const created = await createNewSheet(currentUser.token, "Untitled Sheet");
    if (!created) return;
    navigateTo(`${ROUTES.APP}/${created.id}`);
  };

  const isDarkMode = theme === "dark";

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {isDarkMode ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>

        <Header
          title={sheetTitle}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((value) => !value)}
          onOpenImport={onOpenImport}
          onOpenExport={onOpenExport}
          onCreateNewSheet={handleCreateNewSheet}
          onTitleChange={(nextTitle) => setSheetTitle(nextTitle)}
          onLogout={onLogout}
          onBackProfile={onBackProfile}
        />

        {isEditing && (
          <>
            <AddTopicForm title={title} onTitleChange={(e) => setTitle(e.target.value)} onAdd={handleAdd} />
            {limitWarning && (
              <div className="mb-4 flex items-center justify-between rounded-md border border-amber-600/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                <span>{limitWarning}</span>
                <button
                  type="button"
                  className="rounded border border-amber-500 px-2 py-0.5 text-xs"
                  onClick={clearLimitWarning}
                >
                  Dismiss
                </button>
              </div>
            )}

            <QuestionSearch value={searchQuery} onChange={setSearchQuery} />
          </>
        )}

        <main>
          {(isLoading || loadError) && (
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-300">{isLoading ? "Loading sheet..." : loadError}</p>
          )}
          {isEditing ? (
            <TopicList isEditing searchQuery={searchQuery} />
          ) : (
            <SheetDashboardView title={sheetTitle || "Advanced DSA Sheet - V2"} topics={topics} />
          )}
        </main>
      </div>
    </div>
  );
}

export default SheetPage;
