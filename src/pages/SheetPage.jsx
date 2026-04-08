import { useEffect, useRef, useState } from "react";
import AddTopicForm from "../components/AddTopicForm";
import Header from "../components/Header";
import QuestionSearch from "../components/QuestionSearch";
import SheetDashboardView from "../components/SheetDashboardView";
import TopicList from "../components/TopicList";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import SiteNav from "../components/SiteNav";
import EditorActionPanel from "../components/EditorActionPanel";

function SheetPage({ sheetId, onOpenImport, onOpenExport, theme, onThemeChange }) {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = useAuthStore((state) => state.currentUser);
  const addTopic = useSheetStore((state) => state.addTopic);
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

  const handleNavigateWithUnsavedChanges = async (navigateAction) => {
    if (!hasPendingChanges) {
      navigateAction();
      return;
    }

    const shouldSave = window.confirm(
      "You have unsaved changes. Click OK to save before leaving, or Cancel to choose discard."
    );

    if (shouldSave) {
      if (!currentUser?.token || !sheetId) return;
      const wasSaved = await saveCurrentSheetDraft(currentUser.token);
      if (!wasSaved) {
        window.alert("Could not save your changes. Please try again.");
        return;
      }
      navigateAction();
      return;
    }

    const shouldDiscard = window.confirm("Discard unsaved changes and continue?");
    if (!shouldDiscard) return;

    discardUnsavedChanges();
    navigateAction();
  };

  const sheetActionButtons = [
    { key: "undo", label: "Undo", onClick: undo, disabled: !canUndo },
    { key: "redo", label: "Redo", onClick: redo, disabled: !canRedo },
    { key: "save", label: isSaving ? "Saving..." : "Save", onClick: handleSaveChanges, disabled: !hasPendingChanges || isSaving },
    { key: "discard", label: "Discard", onClick: handleCancelChanges, disabled: !hasPendingChanges || isSaving },
    {
      key: "import",
      label: "Import",
      onClick: () => {
        void handleNavigateWithUnsavedChanges(onOpenImport);
      },
      disabled: false,
    },
    {
      key: "export",
      label: "Export",
      onClick: () => {
        void handleNavigateWithUnsavedChanges(onOpenExport);
      },
      disabled: false,
    },
    { key: "view-only", label: isEditing ? "View Only" : "Edit Sheet", onClick: () => setIsEditing((value) => !value), disabled: false },
  ];

  return (
    <div className="app-shell bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors">
      <SiteNav />
      <div className="app-content">
        <Header
          title={sheetTitle}
          onTitleChange={(nextTitle) => setSheetTitle(nextTitle)}
          theme={theme}
          onThemeChange={onThemeChange}
          userLabel={currentUser?.fullName || currentUser?.email || "Account"}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-4 shadow-xl sm:p-5">
            {isEditing && (
              <>
                <AddTopicForm title={title} onTitleChange={(event) => setTitle(event.target.value)} onAdd={handleAdd} />
                {limitWarning && (
                  <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-500/45 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                    <span>{limitWarning}</span>
                    <button
                      type="button"
                      className="rounded-md border border-amber-500/70 px-2 py-0.5 text-xs"
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
                <p className="mb-4 text-sm text-[var(--text-muted)]">{isLoading ? "Loading sheet..." : loadError || saveError}</p>
              )}
              {isEditing ? (
                <TopicList isEditing searchQuery={searchQuery} />
              ) : (
                <SheetDashboardView title={sheetTitle || "Advanced DSA Sheet - V2"} topics={topics} />
              )}
            </main>
          </div>

          <div className="xl:sticky xl:top-6 xl:h-fit">
            <EditorActionPanel actions={sheetActionButtons} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SheetPage;
