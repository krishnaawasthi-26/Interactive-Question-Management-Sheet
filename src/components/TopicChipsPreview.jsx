import TopicChip from "./TopicChip";

function TopicChipsPreview({ tags = [], maxVisible = 2, placeholder = "No topic" }) {
  if (!tags.length) {
    return (
      <span className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">
        {placeholder}
      </span>
    );
  }

  const visible = tags.slice(0, maxVisible);
  const hidden = tags.slice(maxVisible);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <TopicChip key={tag.id} label={tag.name} color={tag.color} readOnly />
      ))}
      {hidden.length ? (
        <span
          className="inline-flex cursor-default items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
          title={hidden.map((tag) => tag.name).join(", ")}
        >
          +{hidden.length}
        </span>
      ) : null}
    </div>
  );
}

export default TopicChipsPreview;
