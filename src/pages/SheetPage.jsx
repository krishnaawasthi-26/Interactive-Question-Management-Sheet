import { useEffect, useRef, useState } from "react";
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
  const saveCurrentSheetDraft = useSheetStore((state) => state.saveCurrentSheetDraft);
  const discardUnsavedChanges = useSheetStore((state) => state.discardUnsavedChanges);
  const isLoading = useSheetStore((state) => state.isLoading);
  const isSaving = useSheetStore((state) => state.isSaving);
  const loadError = useSheetStore((state) => state.loadError);
  const saveError = useSheetStore((state) => state.saveError);
  const hasPendingChanges = useSheetStore((state) => state.hasPendingChanges);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const setSheetTitle = useSheetStore((state) => state.setSheetTitle);
  const topics = useSheetStore((state) => state.topics);
  const limitWarning = useSheetStore((state) => state.limitWarning);
  const clearLimitWarning = useSheetStore((state) => state.clearLimitWarning);
  const undo = useSheetStore((state) => state.undo);
  const redo = useSheetStore((state) => state.redo);
  const canUndo = useSheetStore((state) => state.past.length > 0);
  const canRedo = useSheetStore((state) => state.future.length > 0);
  const suppressHashGuardRef = useRef(false);
  const previousHashRef = useRef(window.location.hash);

  useEffect(() => {
    if (!sheetId || !currentUser?.token) return;
    loadSheetById(currentUser.token, sheetId);
  }, [sheetId, loadSheetById, currentUser?.token]);

  useEffect(() => {
    previousHashRef.current = window.location.hash;
  }, []);

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!hasPendingChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const onHashChange = () => {
      if (suppressHashGuardRef.current) {
        suppressHashGuardRef.current = false;
        previousHashRef.current = window.location.hash;
        return;
      }

      if (!hasPendingChanges) {
        previousHashRef.current = window.location.hash;
        return;
      }

      const shouldLeave = window.confirm("You have unsaved changes. Save or cancel your edits before leaving this page.");
      if (!shouldLeave) {
        suppressHashGuardRef.current = true;
        window.location.hash = previousHashRef.current;
        return;
      }
      previousHashRef.current = window.location.hash;
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [hasPendingChanges]);

  const handleSaveChanges = async () => {
    if (!currentUser?.token || !sheetId) return;
    await saveCurrentSheetDraft(currentUser.token);
  };

  const handleCancelChanges = () => {
    if (!hasPendingChanges) return;
    const confirmed = window.confirm("Discard all unsaved changes?");
    if (!confirmed) return;
    discardUnsavedChanges();
  };

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
          {(isLoading || loadError || saveError) && (
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-300">
              {isLoading ? "Loading sheet..." : loadError || saveError}
            </p>
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

      <div className="fixed left-2 top-1/3 z-50 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className="rounded-r-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-200 shadow-lg backdrop-blur disabled:cursor-not-allowed disabled:opacity-50"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className="rounded-r-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-200 shadow-lg backdrop-blur disabled:cursor-not-allowed disabled:opacity-50"
        >
          Redo
        </button>
      </div>

      <div className="fixed right-2 top-1/3 z-50 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        <button
          type="button"
          onClick={handleSaveChanges}
          disabled={!hasPendingChanges || isSaving}
          className="rounded-l-xl border border-emerald-600 bg-emerald-700/30 px-3 py-2 text-xs font-semibold text-emerald-100 shadow-lg backdrop-blur disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleCancelChanges}
          disabled={!hasPendingChanges || isSaving}
          className="rounded-l-xl border border-rose-600 bg-rose-700/30 px-3 py-2 text-xs font-semibold text-rose-100 shadow-lg backdrop-blur disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel Changes
        </button>
      </div>
    </div>
  );
}

export default SheetPage;
