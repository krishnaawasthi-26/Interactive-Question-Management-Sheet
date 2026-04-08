function MetaBadge({ value }) {
  return <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">{value}</span>;
}

function SheetHeader({ title, description, topicsCount, questionCount, updatedAt, onOpenEdit }) {
  return (
    <header className="panel-elevated rounded-3xl px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Public Sheet</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{title || "Question Sheet"}</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <MetaBadge value="Public" />
            <MetaBadge value="Read-only" />
            <MetaBadge value={`${topicsCount} topics`} />
            <MetaBadge value={`${questionCount} questions`} />
            <MetaBadge value={`Updated ${updatedAt}`} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 max-md:w-full">
          <button className="btn-base btn-primary">Follow</button>
          <button className="btn-base btn-neutral">Fork Sheet</button>
          <button className="btn-base btn-neutral">Share</button>
          {onOpenEdit ? <button type="button" onClick={onOpenEdit} className="btn-base btn-neutral max-sm:hidden">Open in Edit Mode</button> : null}
          <button className="btn-base btn-neutral px-3" aria-label="More actions">⋯</button>
        </div>
      </div>
    </header>
  );
}

export default SheetHeader;
