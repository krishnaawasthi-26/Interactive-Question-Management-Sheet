import { useEffect, useMemo, useState } from "react";

const RING_RADIUS = 58;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const formatRelativeUpdatedAt = (value) => {
  if (!value) return "Not updated yet";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Not updated yet";

  const elapsedMs = Date.now() - timestamp;
  if (elapsedMs < 0) return "Just now";

  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) return `${elapsedDays}d ago`;

  return new Date(timestamp).toLocaleDateString();
};

function MetaItem({ label, value, onClick }) {
  const content = (
    <>
      <span className="text-[var(--text-tertiary)]">{label}</span>
      <span className="font-medium text-[var(--text-primary)]">{value}</span>
    </>
  );

  if (!onClick) {
    return <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm">{content}</p>;
  }

  return (
    <button type="button" className="btn-base btn-neutral rounded-full px-3 py-1 text-xs sm:text-sm" onClick={onClick}>
      {content}
    </button>
  );
}

function SheetHeader({
  title,
  description,
  completedCount,
  totalCount,
  updatedAt,
  metadata = [],
  downloadsCount,
  copiesCount,
  onDownloadsClick,
  onCopiesClick,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const safeCompleted = Number.isFinite(completedCount) ? Math.max(0, completedCount) : 0;
  const safeTotal = Number.isFinite(totalCount) ? Math.max(0, totalCount) : 0;
  const percent = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimatedPercent(percent));
    return () => window.cancelAnimationFrame(frame);
  }, [percent]);

  const ringOffset = RING_CIRCUMFERENCE - (Math.min(100, Math.max(0, animatedPercent)) / 100) * RING_CIRCUMFERENCE;
  const safeDescription = description?.trim() || "No description added yet.";
  const hasLongDescription = safeDescription.length > 180;
  const displayMetadata = useMemo(
    () => [
      { label: "Last updated", value: formatRelativeUpdatedAt(updatedAt) },
      { label: "Total questions", value: safeTotal },
      { label: "Completed", value: safeCompleted },
      ...metadata,
    ],
    [metadata, safeCompleted, safeTotal, updatedAt]
  );

  return (
    <header className="panel-elevated mb-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)]/90 p-5 shadow-[0_18px_48px_-24px_var(--shadow-color)] sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">{title || "Question Sheet"}</h1>
          <div className="mt-2">
            <p
              className={`text-sm leading-6 text-[var(--text-secondary)] ${!isExpanded ? "overflow-hidden" : ""}`}
              style={!isExpanded ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" } : undefined}
            >
              {safeDescription}
            </p>
            {hasLongDescription ? (
              <button type="button" className="btn-base btn-neutral mt-2 rounded-full px-3 py-1 text-xs" onClick={() => setIsExpanded((value) => !value)}>
                {isExpanded ? "Show less" : "Read more"}
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {displayMetadata.map((item) => (
              <MetaItem key={`${item.label}-${item.value}`} label={item.label} value={item.value} />
            ))}
            {Number.isFinite(downloadsCount) ? (
              <MetaItem label="Downloads" value={downloadsCount} onClick={onDownloadsClick} />
            ) : null}
            {Number.isFinite(copiesCount) ? (
              <MetaItem label="Copies" value={copiesCount} onClick={onCopiesClick} />
            ) : null}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/70 p-4 text-center">
          <div className="relative mx-auto h-36 w-36">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 132 132" aria-label="Sheet completion progress">
              <circle cx="66" cy="66" r={RING_RADIUS} fill="none" stroke="var(--border-subtle)" strokeWidth="9" />
              <circle
                cx="66"
                cy="66"
                r={RING_RADIUS}
                fill="none"
                stroke="var(--accent-primary)"
                strokeLinecap="round"
                strokeWidth="9"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                style={{ transition: "stroke-dashoffset 700ms ease" }}
              />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-semibold text-[var(--text-primary)]">{percent}%</p>
              <p className="text-xs text-[var(--text-secondary)]">{safeCompleted}/{safeTotal}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{safeCompleted} / {safeTotal} completed</p>
        </div>
      </div>
    </header>
  );
}

export default SheetHeader;
