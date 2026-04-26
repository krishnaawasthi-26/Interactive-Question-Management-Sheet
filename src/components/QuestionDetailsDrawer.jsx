import { useEffect, useMemo, useState } from "react";
import DifficultyBadge from "./DifficultyBadge";
import DifficultyCategorySelector from "./DifficultyCategorySelector";
import TopicChipsPreview from "./TopicChipsPreview";
import TopicChip from "./TopicChip";
import ResourceLinksEditor from "./ResourceLinksEditor";
import { buildCategoryValue, resolveQuestionDifficulty } from "../services/difficultyCategories";

function normalizeLinks(question) {
  if (Array.isArray(question.resourceLinks)) return question.resourceLinks;
  const legacy = [
    question.link ? { id: "legacy-link", title: "Problem", url: question.link, type: "Solution" } : null,
    question.articleLink ? { id: "legacy-article", title: "Article", url: question.articleLink, type: "Article" } : null,
    question.videoLink ? { id: "legacy-video", title: "Video", url: question.videoLink, type: "Video" } : null,
  ].filter(Boolean);
  return legacy;
}

function QuestionDetailsDrawer({
  open,
  question,
  questionContext,
  onClose,
  onSave,
  readOnly = false,
  difficultyCategories = [],
  topicTags = [],
}) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!question) return;
    setDraft({
      ...question,
      notes: question.notes || "",
      resourceLinks: normalizeLinks(question),
      topicTagIds: question.topicTagIds || [],
    });
  }, [question]);

  const attachedTags = useMemo(() => {
    if (!draft) return [];
    const ids = new Set(draft.topicTagIds || []);
    return topicTags.filter((tag) => ids.has(tag.id));
  }, [draft, topicTags]);

  const hasChanges = useMemo(() => {
    if (!question || !draft) return false;
    return JSON.stringify({ ...question, resourceLinks: normalizeLinks(question), topicTagIds: question.topicTagIds || [], notes: question.notes || "" })
      !== JSON.stringify(draft);
  }, [draft, question]);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key !== "Escape" || !open) return;
      if (hasChanges && !window.confirm("Discard changes?")) return;
      onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [hasChanges, onClose, open]);

  if (!open || !question || !draft) return null;

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        topicId: questionContext.topicId,
        subId: questionContext.subId,
        questionId: question.id,
        payload: {
          difficultyKey: draft.difficultyKey || null,
          difficultyCategoryId: draft.difficultyCategoryId || null,
          difficultyLabel: draft.difficultyLabel || null,
          difficultyColor: draft.difficultyColor || null,
          topicTagIds: draft.topicTagIds || [],
          notes: draft.notes,
          resourceLinks: draft.resourceLinks,
          link: draft.resourceLinks.find((item) => item.type === "Solution")?.url || "",
          articleLink: draft.resourceLinks.find((item) => item.type === "Article")?.url || "",
          videoLink: draft.resourceLinks.find((item) => item.type === "Video")?.url || "",
          updatedAt: new Date().toISOString(),
        },
      });
      setToast({ type: "success", message: "Question details saved." });
      onClose();
    } catch {
      setToast({ type: "error", message: "Save failed. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const resolvedDifficulty = resolveQuestionDifficulty(draft, difficultyCategories);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[var(--overlay-backdrop)]/70 backdrop-blur-[1px]" onClick={() => {
        if (hasChanges && !window.confirm("Discard changes?")) return;
        onClose();
      }} />
      <aside className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--surface)] shadow-2xl md:w-[80vw] lg:w-[640px]">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button type="button" className="btn-base btn-neutral btn-sm px-2 py-1" onClick={() => {
                if (hasChanges && !window.confirm("Discard changes?")) return;
                onClose();
              }}>✕</button>
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{question.text}</p>
            </div>
          </div>
          {!readOnly ? (
            <div className="flex items-center gap-2">
              <button type="button" className="btn-base btn-neutral px-3 py-1.5 text-sm" onClick={() => {
                if (hasChanges && !window.confirm("Discard changes?")) return;
                onClose();
              }}>Cancel</button>
              <button type="button" className="btn-base btn-primary px-3 py-1.5 text-sm" disabled={!hasChanges || saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
            </div>
          ) : null}
        </header>

        <div className="space-y-5 p-4">
          {readOnly ? (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-secondary)]">
              Read-only view. Copy this sheet to customize question metadata.
            </div>
          ) : null}
          <section className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3">
            <h3 className="text-sm font-semibold">Overview</h3>
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge question={draft} difficultyCategories={difficultyCategories} />
              <TopicChipsPreview tags={attachedTags} />
              <span className="text-xs text-[var(--text-tertiary)]">Updated: {new Date(draft.updatedAt || Date.now()).toLocaleString()}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Resources: {draft.resourceLinks?.length || 0} links • {draft.notes ? 1 : 0} notes • {attachedTags.length} topics</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Difficulty</h3>
            <DifficultyCategorySelector
              value={buildCategoryValue(resolvedDifficulty)}
              defaultCategories={difficultyCategories.filter((entry) => entry.type === "default" && entry.tier === "default")}
              extraCategories={difficultyCategories.filter((entry) => entry.type === "default" && entry.tier === "extra")}
              customCategories={difficultyCategories.filter((entry) => entry.type === "custom")}
              onChange={(value) => {
                if (value.startsWith("default:")) {
                  const key = value.replace("default:", "");
                  const found = difficultyCategories.find((entry) => entry.type === "default" && entry.key === key);
                  setDraft((current) => ({
                    ...current,
                    difficultyKey: key,
                    difficultyCategoryId: null,
                    difficultyLabel: found?.label || current.difficultyLabel,
                    difficultyColor: found?.color || current.difficultyColor,
                  }));
                }
                if (value.startsWith("custom:")) {
                  const id = value.replace("custom:", "");
                  const found = difficultyCategories.find((entry) => entry.type === "custom" && entry.id === id);
                  if (!found) return;
                  setDraft((current) => ({
                    ...current,
                    difficultyKey: null,
                    difficultyCategoryId: id,
                    difficultyLabel: found.label,
                    difficultyColor: found.color,
                  }));
                }
              }}
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Topics</h3>
            <div className="flex flex-wrap gap-1.5">
              {attachedTags.map((tag) => (
                <TopicChip key={tag.id} label={tag.name} color={tag.color} readOnly={readOnly} onRemove={!readOnly ? () => {
                  setDraft((current) => ({ ...current, topicTagIds: current.topicTagIds.filter((id) => id !== tag.id) }));
                } : undefined} />
              ))}
              {!attachedTags.length ? <span className="text-xs text-[var(--text-tertiary)]">No topic</span> : null}
            </div>
            {!readOnly ? (
              <select className="field-base w-full text-sm" defaultValue="" onChange={(event) => {
                const id = event.target.value;
                if (!id) return;
                setDraft((current) => ({ ...current, topicTagIds: [...new Set([...(current.topicTagIds || []), id])] }));
                event.target.value = "";
              }}>
                <option value="">Add topic...</option>
                {topicTags.filter((tag) => !(draft.topicTagIds || []).includes(tag.id)).map((tag) => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            ) : null}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Resources / Links</h3>
            <ResourceLinksEditor value={draft.resourceLinks} onChange={(next) => setDraft((current) => ({ ...current, resourceLinks: next }))} readOnly={readOnly} />
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="text-xs text-[var(--text-tertiary)]">Use this for approach, mistakes, revision points, or interview notes.</p>
            <textarea className="field-base min-h-32 w-full text-sm" value={draft.notes || ""} disabled={readOnly} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
          </section>
        </div>
      </aside>
      {toast ? (
        <div className={`fixed bottom-4 right-4 z-[60] rounded-lg border px-3 py-2 text-sm shadow-xl ${toast.type === "error" ? "border-[var(--accent-danger)] bg-[color-mix(in_srgb,var(--accent-danger)_18%,var(--surface))]" : "border-[var(--accent-success)] bg-[color-mix(in_srgb,var(--accent-success)_18%,var(--surface))]"}`}>
          {toast.message}
        </div>
      ) : null}
    </>
  );
}

export default QuestionDetailsDrawer;
