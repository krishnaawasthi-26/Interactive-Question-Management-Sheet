import { useEffect, useRef, useState } from "react";
import AddTopicForm from "../components/AddTopicForm";
import QuestionSearch from "../components/QuestionSearch";
import SheetDashboardView from "../components/SheetDashboardView";
import TopicList from "../components/TopicList";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";
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
      label: "Import JSON",
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
    <AppShell
      title={sheetTitle || "Untitled Sheet"}
      subtitle="Draft • Last edited just now"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.fullName || currentUser?.email || "Account"}
      rightPanel={isEditing ? <EditorActionPanel actions={sheetActionButtons} /> : null}
    >
      <div className="panel rounded-3xl p-4 sm:p-5">
        {isEditing && (
          <>
            <AddTopicForm title={title} onTitleChange={(event) => setTitle(event.target.value)} onAdd={handleAdd} />
            {limitWarning && (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,var(--surface-elevated))] px-3 py-2 text-sm text-[var(--text-primary)]">
                <span>{limitWarning}</span>
                <button type="button" className="btn-base btn-neutral px-2 py-1 text-xs" onClick={clearLimitWarning}>
                  Dismiss
                </button>
              </div>
            )}

            <QuestionSearch value={searchQuery} onChange={setSearchQuery} />
          </>
        )}

        <main>
          {(isLoading || loadError || saveError) && (
            <p className="mb-4 text-sm text-[var(--text-secondary)]">{isLoading ? "Loading sheet..." : loadError || saveError}</p>
          )}
          {isEditing ? <TopicList isEditing searchQuery={searchQuery} /> : <SheetDashboardView title={sheetTitle} topics={topics} onOpenEdit={() => setIsEditing(true)} />}
        </main>
      </div>
    </AppShell>
  );
}

export default SheetPage;
