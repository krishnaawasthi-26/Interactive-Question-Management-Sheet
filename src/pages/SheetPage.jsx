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
        <Header title={sheetTitle} onTitleChange={(nextTitle) => setSheetTitle(nextTitle)} />

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


      <aside className="fixed right-3 top-24 z-50 hidden w-52 rounded-2xl border border-zinc-700 bg-zinc-900/90 p-3 shadow-2xl backdrop-blur lg:block">
        <div className="flex flex-col gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-left text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-left text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Redo
          </button>

          <div className="my-1 h-px bg-zinc-700" />

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!hasPendingChanges || isSaving}
            className="rounded-md border border-emerald-600 bg-emerald-700/30 px-3 py-2 text-left text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={handleCancelChanges}
            disabled={!hasPendingChanges || isSaving}
            className="rounded-md border border-rose-600 bg-rose-700/30 px-3 py-2 text-left text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard
          </button>

          <div className="my-1 h-px bg-zinc-700" />

          <button
            type="button"
            onClick={onOpenImport}
            className="rounded-md border border-sky-600 bg-sky-700/20 px-3 py-2 text-left text-sky-200"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={onOpenExport}
            className="rounded-md border border-emerald-600 bg-emerald-700/20 px-3 py-2 text-left text-emerald-200"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => setIsEditing((value) => !value)}
            className="rounded-md border border-gray-700 px-3 py-2 text-left text-gray-200"
          >
            {isEditing ? "View Only" : "Edit Sheet"}
          </button>

          <div className="my-1 h-px bg-zinc-700" />

          <button type="button" onClick={onBackProfile} className="rounded-md border border-zinc-700 px-3 py-2 text-left text-zinc-200">
            Profile
          </button>
          <button type="button" onClick={handleCreateNewSheet} className="rounded-md border border-orange-600 px-3 py-2 text-left text-orange-200">
            New Sheet
          </button>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.ABOUT)}
            className="rounded-md border border-zinc-700 px-3 py-2 text-left text-zinc-200"
          >
            About Us
          </button>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.HOW_TO_USE)}
            className="rounded-md border border-zinc-700 px-3 py-2 text-left text-zinc-200"
          >
            How To Use
          </button>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.CONTACT)}
            className="rounded-md border border-zinc-700 px-3 py-2 text-left text-zinc-200"
          >
            Contact Us
          </button>
          <button
            type="button"
            onClick={() => navigateTo(ROUTES.LEARNING_INSIGHTS)}
            className="rounded-md border border-zinc-700 px-3 py-2 text-left text-zinc-200"
          >
            Learning Insights
          </button>
          <a
            href="https://leetcode.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-700 px-3 py-2 text-left text-amber-300"
          >
            LeetCode
          </a>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-rose-700 px-3 py-2 text-left text-rose-200"
          >
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
}

export default SheetPage;
