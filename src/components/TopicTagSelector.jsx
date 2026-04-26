import { useMemo, useState } from "react";
import TopicChip from "./TopicChip";

function TopicTagSelector({
  question,
  topicTags,
  readOnly = false,
  onAssign,
  onRemove,
  onAddCustom,
  onEditCustom,
  onDeleteCustom,
}) {
  const [open, setOpen] = useState(false);
  const attached = useMemo(() => new Set(question.topicTagIds || []), [question.topicTagIds]);

  return (
    <div className="mt-1 sm:pl-7">
      <div className="flex flex-wrap items-center gap-1.5">
        {topicTags.filter((tag) => attached.has(tag.id)).map((tag) => (
          <TopicChip
            key={tag.id}
            label={tag.name}
            color={tag.color}
            readOnly={readOnly || tag.type === "DEFAULT"}
            onRemove={!readOnly && tag.type !== "DEFAULT" ? () => onRemove(tag.id) : undefined}
          />
        ))}
        {!readOnly ? <button type="button" className="rounded-md border border-[var(--border-subtle)] px-2 py-0.5 text-[11px]" onClick={() => setOpen((v) => !v)}>+ Tags</button> : null}
      </div>
      {!readOnly && open ? (
        <div className="mt-1 max-h-36 overflow-auto rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1.5 text-xs">
          {topicTags.map((tag) => (
            <div key={tag.id} className="group flex items-center justify-between rounded px-1 py-1 hover:bg-[var(--surface)]">
              <button type="button" className="flex items-center gap-2" onClick={() => (attached.has(tag.id) ? onRemove(tag.id) : onAssign(tag.id))}>
                <span className="h-2 w-2 rounded-full" style={{ background: tag.color }} />
                <span>{tag.name}</span>
              </button>
              {tag.type === "CUSTOM" ? (
                <span className="hidden items-center gap-1 group-hover:inline-flex">
                  <button type="button" onClick={() => onEditCustom(tag)} title="Edit">✎</button>
                  <button type="button" onClick={() => onDeleteCustom(tag)} title="Delete">🗑</button>
                </span>
              ) : null}
            </div>
          ))}
          <button type="button" className="mt-1 w-full rounded border border-dashed border-[var(--border-subtle)] px-2 py-1 text-left" onClick={onAddCustom}>+ Add Custom Topic</button>
        </div>
      ) : null}
    </div>
  );
}

export default TopicTagSelector;
