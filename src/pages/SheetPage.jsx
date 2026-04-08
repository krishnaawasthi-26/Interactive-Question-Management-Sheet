import { useCallback, useEffect, useRef, useState } from "react";
import AddTopicForm from "../components/AddTopicForm";
import QuestionSearch from "../components/QuestionSearch";
import SheetDashboardView from "../components/SheetDashboardView";
import TopicList from "../components/TopicList";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";
import EditorActionPanel from "../components/EditorActionPanel";
import ConfirmationModal from "../components/ConfirmationModal";

const formatRelativeTime = (isoValue) => {
  if (!isoValue) return "Not saved yet";

  const elapsedMs = Date.now() - new Date(isoValue).getTime();
  if (Number.isNaN(elapsedMs)) return "Not saved yet";

  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  if (elapsedSeconds < 5) return "just now";
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
};

function SheetPage({ sheetId, onOpenImport, onOpenExport, theme, onThemeChange }) {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDialog, setActiveDialog] = useState(null);
  const [, setNowTick] = useState(0);

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
  const lastSavedAt = useSheetStore((state) => state.lastSavedAt);
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
    const interval = window.setInterval(() => {
      setNowTick((tick) => tick + 1);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [lastSavedAt]);

  const closeDialog = useCallback(() => setActiveDialog(null), []);

  const handleSaveChanges = useCallback(async () => {
    if (!currentUser?.token || !sheetId) return false;
    return saveCurrentSheetDraft(currentUser.token);
  }, [currentUser, saveCurrentSheetDraft, sheetId]);

  const handleDiscardChanges = useCallback(() => {
    discardUnsavedChanges();
    closeDialog();
  }, [closeDialog, discardUnsavedChanges]);

  const openDiscardDialog = useCallback(() => {
    setActiveDialog({
      key: "discard",
      title: "Discard unsaved changes?",
      message: "This will remove all edits made since your last successful save.",
      actions: [
        { key: "cancel", label: "Cancel", variant: "neutral", onClick: closeDialog },
        { key: "discard", label: "Discard", variant: "danger", onClick: handleDiscardChanges },
      ],
    });
  }, [closeDialog, handleDiscardChanges]);

  const requestNavigation = useCallback((navigateAction, destinationLabel) => {
    if (!hasPendingChanges) {
      navigateAction();
      return;
    }

    setActiveDialog({
      key: "unsaved-navigation",
      title: "You have unsaved changes",
      message: `Save or discard your edits before you ${destinationLabel}.`,
      actions: [
        { key: "stay", label: "Stay", variant: "neutral", onClick: closeDialog },
        {
          key: "discard",
          label: "Discard & Continue",
          variant: "danger",
          onClick: () => {
            discardUnsavedChanges();
            closeDialog();
            navigateAction();
          },
        },
        {
          key: "save",
          label: "Save & Continue",
          variant: "success",
          onClick: async () => {
            const wasSaved = await handleSaveChanges();
            if (!wasSaved) return;
            closeDialog();
            navigateAction();
          },
        },
      ],
    });
  }, [closeDialog, discardUnsavedChanges, handleSaveChanges, hasPendingChanges]);

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

      const nextHash = window.location.hash;
      if (!hasPendingChanges) {
        previousHashRef.current = nextHash;
        return;
      }

      suppressHashGuardRef.current = true;
      window.location.hash = previousHashRef.current;

      requestNavigation(
        () => {
          suppressHashGuardRef.current = true;
          window.location.hash = nextHash;
          previousHashRef.current = nextHash;
        },
        "leave this page"
      );
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [hasPendingChanges, requestNavigation]);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTopic(title).then((created) => {
      if (created) setTitle("");
    });
  };

  const saveStatusLabel = isSaving
    ? "Saving..."
    : saveError
      ? "Save failed"
      : hasPendingChanges
        ? "Unsaved changes"
        : "Saved";

  const sheetActionButtons = [
    { key: "undo", label: "Undo", onClick: undo, disabled: !canUndo },
    { key: "redo", label: "Redo", onClick: redo, disabled: !canRedo },
    {
      key: "save",
      label: isSaving ? "Saving..." : "Save",
      onClick: () => {
        void handleSaveChanges();
      },
      disabled: !hasPendingChanges || isSaving,
    },
    {
      key: "discard",
      label: "Discard",
      onClick: openDiscardDialog,
      disabled: !hasPendingChanges || isSaving,
    },
    {
      key: "import",
      label: "Import JSON",
      onClick: () => requestNavigation(onOpenImport, "open import"),
      disabled: false,
    },
    {
      key: "export",
      label: "Export",
      onClick: () => requestNavigation(onOpenExport, "open export"),
      disabled: false,
    },
    { key: "view-only", label: isEditing ? "View Only" : "Edit Sheet", onClick: () => setIsEditing((value) => !value), disabled: false },
  ];

  return (
    <>
      <AppShell
        title={isEditing ? sheetTitle || "Untitled Sheet" : null}
        subtitle={isEditing ? `${saveStatusLabel} • Last saved ${formatRelativeTime(lastSavedAt)}` : null}
        theme={theme}
        onThemeChange={onThemeChange}
        userLabel={currentUser?.fullName || currentUser?.email || "Account"}
        rightPanel={isEditing ? <EditorActionPanel actions={sheetActionButtons} /> : null}
        alert={limitWarning}
        onDismissAlert={clearLimitWarning}
      >
        <div className="panel rounded-3xl p-4 sm:p-5">
          {isEditing && (
            <>
              <AddTopicForm title={title} onTitleChange={(event) => setTitle(event.target.value)} onAdd={handleAdd} />
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

      <ConfirmationModal
        isOpen={Boolean(activeDialog)}
        title={activeDialog?.title}
        message={activeDialog?.message}
        actions={activeDialog?.actions}
        onClose={closeDialog}
        isBusy={isSaving}
      />
    </>
  );
}

export default SheetPage;
