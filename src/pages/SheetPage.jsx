import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddTopicForm from "../components/AddTopicForm";
import QuestionSearch from "../components/QuestionSearch";
import TopicList from "../components/TopicList";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import AppShell from "../components/AppShell";
import EditorActionPanel from "../components/EditorActionPanel";
import ConfirmationModal from "../components/ConfirmationModal";
import TopicReminderAlarmPanel from "../components/TopicReminderAlarmPanel";
import { calculateSheetProgress } from "../services/progress";
import { navigateTo, ROUTES } from "../services/routes";
import { getNotificationPermissionState, requestNotificationPermission } from "../services/notifications";
import { createAlarmNotification } from "../api/notificationApi";
import { isPremiumActive } from "../services/premium";
import ProgressBar from "../components/ui/ProgressBar";
import EmptyState from "../components/ui/EmptyState";
import SurfaceCard from "../components/ui/SurfaceCard";

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
  const [sortBy, setSortBy] = useState("edited");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sheetTitles, setSheetTitles] = useState({});
  const [, setNowTick] = useState(0);
  const [topicSchedulerState, setTopicSchedulerState] = useState({ open: false, mode: "reminder" });
  const [scheduledTopicAlerts, setScheduledTopicAlerts] = useState([]);

  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const addTopic = useSheetStore((state) => state.addTopic);
  const loadSheetById = useSheetStore((state) => state.loadSheetById);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const sheets = useSheetStore((state) => state.sheets);
  const saveCurrentSheetDraft = useSheetStore((state) => state.saveCurrentSheetDraft);
  const renameSheet = useSheetStore((state) => state.renameSheet);
  const setSheetVisibility = useSheetStore((state) => state.setSheetVisibility);
  const setSheetArchived = useSheetStore((state) => state.setSheetArchived);
  const duplicateSheetById = useSheetStore((state) => state.duplicateSheetById);
  const deleteSheet = useSheetStore((state) => state.deleteSheet);
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
  const announcedTopicAlertsRef = useRef(new Set());
  const focusProblemId = new URLSearchParams(window.location.search).get("problemId");
  const topicAlertStorageKey = `iqms-topic-alerts:${sheetId || "sheet-index"}`;
  const premiumActive = isPremiumActive(currentUser);
  const isSessionExpiredError = (error) => error?.status === 401;

  useEffect(() => {
    if (!sheetId || !currentUser?.token) return;
    loadSheetById(currentUser.token, sheetId);
  }, [sheetId, loadSheetById, currentUser?.token]);

  useEffect(() => {
    if (sheetId || !currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [sheetId, currentUser?.token, loadSheets]);

  useEffect(() => {
    setSheetTitles((current) => {
      const next = { ...current };
      sheets.forEach((sheet) => {
        if (!(sheet.id in next)) {
          next[sheet.id] = sheet.title || "Untitled Sheet";
        }
      });
      return next;
    });
  }, [sheets]);

  useEffect(() => {
    previousHashRef.current = window.location.hash;
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTick((tick) => tick + 1);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [lastSavedAt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(topicAlertStorageKey);
    if (!raw) {
      setScheduledTopicAlerts([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setScheduledTopicAlerts([]);
        return;
      }
      setScheduledTopicAlerts(parsed);
    } catch {
      setScheduledTopicAlerts([]);
    }
  }, [topicAlertStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(topicAlertStorageKey, JSON.stringify(scheduledTopicAlerts));
  }, [scheduledTopicAlerts, topicAlertStorageKey]);

  useEffect(() => {
    const onOpenTopicScheduler = (event) => {
      const mode = event?.detail?.mode === "alarm" ? "alarm" : "reminder";
      if (!sheetId) return;
      if (!premiumActive) {
        setActiveDialog({
          key: "premium-required",
          title: "Premium feature locked",
          message: "Reminder and alarm are premium features. Buy premium to unlock.",
          actions: [
            { key: "cancel", label: "Maybe Later", variant: "neutral", onClick: () => setActiveDialog(null) },
            { key: "buy", label: "Buy Premium", variant: "success", onClick: () => navigateTo(ROUTES.PREMIUM) },
          ],
        });
        return;
      }
      setTopicSchedulerState({ open: true, mode });
    };

    window.addEventListener("iqms-open-topic-timer", onOpenTopicScheduler);
    return () => window.removeEventListener("iqms-open-topic-timer", onOpenTopicScheduler);
  }, [premiumActive, sheetId]);

  useEffect(() => {
    const tick = () => {
      if (!scheduledTopicAlerts.length) return;
      const now = Date.now();
      const dueAlerts = scheduledTopicAlerts.filter((item) => {
        const scheduledAt = new Date(item.scheduledFor).getTime();
        return !Number.isNaN(scheduledAt) && scheduledAt <= now && !item.completed && !item.triggeredAt;
      });

      if (!dueAlerts.length) return;

      dueAlerts.forEach((item) => {
        if (announcedTopicAlertsRef.current.has(item.id)) return;
        announcedTopicAlertsRef.current.add(item.id);
        if ("Notification" in window && Notification.permission === "granted") {
          const title = item.mode === "alarm" ? `Alarm: ${item.topicTitle}` : `Reminder: ${item.topicTitle}`;
          const body = `Time for topic "${item.topicTitle}" in your sheet.`;
          new Notification(title, { body, tag: `topic-${item.id}` });
        } else {
          setActiveDialog({
            key: `topic-alert-${item.id}`,
            title: item.mode === "alarm" ? "Alarm is due" : "Reminder is due",
            message: `Time for topic "${item.topicTitle}" in your sheet.`,
            actions: [{ key: "ok", label: "OK", variant: "neutral", onClick: () => setActiveDialog(null) }],
          });
        }
      });

      setScheduledTopicAlerts((current) =>
        current.map((item) => {
          const scheduledAt = new Date(item.scheduledFor).getTime();
          if (Number.isNaN(scheduledAt) || scheduledAt > now || item.completed || item.triggeredAt) return item;
          return { ...item, triggeredAt: new Date(now).toISOString() };
        })
      );
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, [scheduledTopicAlerts]);

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

  const saveTopicAlert = async ({ topicId, scheduledFor, mode }) => {
    const topic = topics.find((entry) => entry.id === topicId);
    if (!topic) return;

    if (getNotificationPermissionState() !== "granted") {
      await requestNotificationPermission();
    }

    setScheduledTopicAlerts((current) => [
      ...current,
      {
        id: `topic-alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        topicId,
        topicTitle: topic.title || "Untitled Topic",
        scheduledFor: new Date(scheduledFor).toISOString(),
        mode,
        completed: false,
        triggeredAt: null,
      },
    ]);

    if (!currentUser?.token) return;

    try {
      await createAlarmNotification(currentUser.token, {
        title: `${mode === "alarm" ? "Alarm" : "Reminder"}: ${topic.title || "Topic"}`,
        message: `Time for ${topic.title || "topic"} in ${sheetTitle || "your sheet"}.`,
        scheduledFor: new Date(scheduledFor).toISOString(),
        sourceType: "topic",
        sourceId: topicId,
        actionUrl: sheetId ? `/app/${sheetId}` : "/app",
      });
    } catch (error) {
      if (isSessionExpiredError(error)) {
        logout();
        navigateTo(ROUTES.LOGIN);
        return;
      }
      setActiveDialog({
        key: "topic-alert-save-error",
        title: "Could not save reminder",
        message: error?.message || "Could not save reminder right now. Please try again.",
        actions: [{ key: "ok", label: "OK", variant: "neutral", onClick: () => setActiveDialog(null) }],
      });
    }
  };

  const saveStatusLabel = isSaving
    ? "Saving..."
    : saveError
      ? "Save failed"
      : hasPendingChanges
        ? "Unsaved changes"
        : "Saved";

  const sheetProgressById = useMemo(
    () =>
      Object.fromEntries(
        sheets.map((sheet) => [sheet.id, calculateSheetProgress(sheet)])
      ),
    [sheets]
  );

  const filteredAndSortedSheets = useMemo(
    () =>
      [...sheets]
        .filter((sheet) => {
          if (typeFilter === "all") return true;
          if (typeFilter === "public") return Boolean(sheet.isPublic);
          if (typeFilter === "private") return !sheet.isPublic;
          if (typeFilter === "archived") return Boolean(sheet.isArchived);
          return true;
        })
        .sort((a, b) => {
          if (sortBy === "created") {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          }
          if (sortBy === "progress") {
            return (sheetProgressById[b.id]?.percent || 0) - (sheetProgressById[a.id]?.percent || 0);
          }
          if (sortBy === "type") {
            return Number(Boolean(b.isPublic)) - Number(Boolean(a.isPublic));
          }
          if (sortBy === "questions") {
            return (sheetProgressById[b.id]?.totalQuestions || 0) - (sheetProgressById[a.id]?.totalQuestions || 0);
          }
          if (sortBy === "title") {
            return `${a.title || ""}`.localeCompare(`${b.title || ""}`);
          }
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }),
    [sheetProgressById, sheets, sortBy, typeFilter]
  );

  const groupedSheetActionsById = useMemo(
    () =>
      Object.fromEntries(
        filteredAndSortedSheets.map((sheet) => [
          sheet.id,
          [
            {
              key: "save-name",
              label: "Save Name",
              className: "btn-success",
              onClick: async () => {
                const nextTitle = (sheetTitles[sheet.id] || "").trim();
                if (!nextTitle) return;
                await renameSheet(currentUser.token, sheet.id, nextTitle);
              },
            },
            {
              key: "open",
              label: "Open",
              className: "btn-neutral",
              onClick: () => navigateTo(`${ROUTES.APP}/${sheet.id}`),
            },
            {
              key: "visibility",
              label: sheet.isPublic ? "Make Private" : "Make Public",
              className: "btn-neutral",
              onClick: async () => {
                try {
                  await setSheetVisibility(currentUser.token, sheet.id, !sheet.isPublic);
                } catch (error) {
                  setActiveDialog({
                    key: "visibility-error",
                    title: "Could not update visibility",
                    message: error?.message || "Please try again in a moment.",
                    actions: [{ key: "ok", label: "OK", variant: "neutral", onClick: closeDialog }],
                  });
                }
              },
            },
            {
              key: "archive",
              label: sheet.isArchived ? "Restore" : "Archive",
              className: "btn-neutral",
              onClick: async () => {
                try {
                  await setSheetArchived(currentUser.token, sheet.id, !sheet.isArchived);
                } catch (error) {
                  setActiveDialog({
                    key: "archive-error",
                    title: "Could not update archive state",
                    message: error?.message || "Please try again in a moment.",
                    actions: [{ key: "ok", label: "OK", variant: "neutral", onClick: closeDialog }],
                  });
                }
              },
            },
            {
              key: "copy",
              label: "Copy",
              className: "btn-neutral",
              onClick: async () => {
                const copied = await duplicateSheetById(currentUser.token, sheet.id);
                if (!copied) return;
                navigateTo(`${ROUTES.APP}/${copied.id}`);
              },
            },
            {
              key: "delete",
              label: "Delete",
              className: "btn-danger",
              onClick: async () => {
                if (!window.confirm("Are you sure to delete this sheet?")) return;
                await deleteSheet(currentUser.token, sheet.id);
              },
            },
          ],
        ])
      ),
    [currentUser?.token, deleteSheet, duplicateSheetById, filteredAndSortedSheets, renameSheet, setSheetArchived, setSheetVisibility, sheetTitles]
  );

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
        rightPanel={<EditorActionPanel actions={sheetActionButtons} />}
        alert={limitWarning}
        onDismissAlert={clearLimitWarning}
      >
        <SurfaceCard className="sm:p-5">
          {!sheetId ? (
            <div className="space-y-4">
              <div className="panel-elevated flex flex-wrap items-end gap-3 rounded-xl p-3">
                <label className="text-sm">
                  <span className="mb-1 block text-[var(--text-secondary)]">Sort by</span>
                  <select className="field-base min-w-52" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option value="edited">Last edited</option>
                    <option value="created">Created date</option>
                    <option value="progress">Progress</option>
                    <option value="type">Type (Public/Private)</option>
                    <option value="questions">Question count</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-[var(--text-secondary)]">Sheet type</span>
                  <select className="field-base min-w-44" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                    <option value="all">All sheets</option>
                    <option value="public">Public only</option>
                    <option value="private">Private only</option>
                    <option value="archived">Archived only</option>
                  </select>
                </label>
              </div>

              {filteredAndSortedSheets.length === 0 ? (
                <EmptyState title="No sheets found" description="Try another filter or create a new sheet to begin." icon="🧭" />
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedSheets.map((sheet) => {
                    const progress = sheetProgressById[sheet.id] || { percent: 0, completedQuestions: 0, totalQuestions: 0 };
                    return (
                      <div key={sheet.id} className="panel-elevated flex items-start justify-between gap-4 rounded-xl p-3">
                        <div className="w-full max-w-lg space-y-2">
                          <input
                            className="w-full field-base px-2 py-1 font-medium"
                            value={sheetTitles[sheet.id] ?? (sheet.title || "Untitled Sheet")}
                            onChange={(event) => setSheetTitles((current) => ({ ...current, [sheet.id]: event.target.value }))}
                          />
                          <p className="text-xs text-[var(--text-secondary)]">
                            {sheet.isPublic ? "Public" : "Private"}
                            {sheet.isArchived ? " • Archived" : ""} • Progress {progress.percent}% ({progress.completedQuestions}/{progress.totalQuestions})
                          </p>
                          <ProgressBar percent={progress.percent} tone={progress.percent > 70 ? "success" : "warning"} />
                          <p className="text-xs text-[var(--text-secondary)]">
                            Created: {sheet.createdAt ? new Date(sheet.createdAt).toLocaleDateString() : "Unknown"} •
                            Updated: {sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleString() : "Unknown"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {(groupedSheetActionsById[sheet.id] || []).filter((action) => ["open", "save-name", "visibility"].includes(action.key)).map((action) => (
                              <button key={action.key} type="button" className={`btn-base ${action.className} px-2 py-1`} onClick={action.onClick}>
                                {action.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-2">
                            {(groupedSheetActionsById[sheet.id] || []).filter((action) => ["archive", "copy", "delete"].includes(action.key)).map((action) => (
                              <button key={action.key} type="button" className={`btn-base ${action.className} px-2 py-1`} onClick={action.onClick}>
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
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
            <TopicList
              isEditing={isEditing}
              searchQuery={searchQuery}
              allowProgressToggle={isEditing}
              focusProblemId={focusProblemId}
              premiumActive={premiumActive}
              onPremiumLocked={(message) =>
                setActiveDialog({
                  key: "premium-required",
                  title: "Premium feature locked",
                  message,
                  actions: [
                    { key: "cancel", label: "Close", variant: "neutral", onClick: closeDialog },
                    { key: "buy", label: "Buy Premium", variant: "success", onClick: () => navigateTo(ROUTES.PREMIUM) },
                  ],
                })
              }
            />
          </main>
            </>
          )}
        </SurfaceCard>
      </AppShell>

      <ConfirmationModal
        isOpen={Boolean(activeDialog)}
        title={activeDialog?.title}
        message={activeDialog?.message}
        actions={activeDialog?.actions}
        onClose={closeDialog}
        isBusy={isSaving}
      />

      <TopicReminderAlarmPanel
        open={topicSchedulerState.open}
        mode={topicSchedulerState.mode}
        topics={topics}
        scheduledAlerts={scheduledTopicAlerts.filter((item) => {
          if (item.completed) return false;
          const scheduledAt = new Date(item.scheduledFor).getTime();
          return Number.isNaN(scheduledAt) || scheduledAt > Date.now();
        })}
        onModeChange={(mode) => setTopicSchedulerState((current) => ({ ...current, mode }))}
        onSave={saveTopicAlert}
        onDelete={(id) => setScheduledTopicAlerts((current) => current.filter((item) => item.id !== id))}
        onClose={() => setTopicSchedulerState((current) => ({ ...current, open: false }))}
      />
    </>
  );
}

export default SheetPage;
