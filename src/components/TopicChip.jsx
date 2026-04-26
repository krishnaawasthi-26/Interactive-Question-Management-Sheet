function TopicChip({ label, color, onRemove, readOnly = false }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
      style={{ borderColor: "color-mix(in srgb, black 35%, transparent)", color, background: "color-mix(in srgb, var(--surface-elevated) 82%, transparent)" }}
    >
      {label}
      {!readOnly && onRemove ? (
        <button type="button" className="text-[10px] opacity-80 transition hover:opacity-100" onClick={onRemove} aria-label={`Remove ${label}`}>
          ✕
        </button>
      ) : null}
    </span>
  );
}

export default TopicChip;
