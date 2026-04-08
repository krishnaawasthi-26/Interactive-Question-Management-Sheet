import { useEffect, useState } from "react";
import AddTopicForm from "../components/AddTopicForm";
import Header from "../components/Header";
import QuestionSearch from "../components/QuestionSearch";
import SheetDashboardView from "../components/SheetDashboardView";
import TopicList from "../components/TopicList";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { navigateTo, ROUTES } from "../services/hashRouter";
import SiteNav from "../components/SiteNav";

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

  return (
    <div className="app-shell bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors">
      <SiteNav />
      <div className="app-content rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)]/70 p-4 shadow-2xl sm:p-6">
        <Header
          title={sheetTitle}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((value) => !value)}
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

      <button
        type="button"
        onClick={onOpenImport}
        className="fixed left-2 top-1/2 z-50 hidden -translate-y-1/2 rounded-r-xl border border-sky-600 bg-sky-700/20 px-3 py-2 text-xs font-semibold text-sky-200 shadow-lg backdrop-blur lg:block"
      >
        Import JSON
      </button>
      <button
        type="button"
        onClick={onOpenExport}
        className="fixed right-2 top-1/2 z-50 hidden -translate-y-1/2 rounded-l-xl border border-emerald-600 bg-emerald-700/20 px-3 py-2 text-xs font-semibold text-emerald-200 shadow-lg backdrop-blur lg:block"
      >
        Export
      </button>
    </div>
  );
}

export default SheetPage;
