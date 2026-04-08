import { useMemo } from "react";

const STATUS_STYLES = {
  "In Progress": "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  "Solve!": "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  Completed: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
};

function getSheetRows(topics) {
  const rows = [];
  topics.forEach((topic) => {
    (topic.subTopics || []).forEach((subTopic) => {
      (subTopic.questions || []).forEach((question, index) => {
        const resourceLink = question.link || question.url || question.resourceUrl || "";
        rows.push({
          id: `${topic.id || topic.title}-${subTopic.id || subTopic.title}-${question.id || index}`,
          topic: topic.title || "General",
          question: question.text || subTopic.title || "Untitled question",
          primary: resourceLink,
          video: question.videoLink || "",
          notes: question.attempt?.notes?.trim() || "",
          status: question.done ? "Completed" : question.attempt ? "In Progress" : "Solve!",
        });
      });
    });
  });
  return rows;
}

function formatRelativeDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function SheetMetaBadges({ topicsCount, questionCount }) {
  const badges = [
    "Read-only",
    "Public",
    `${topicsCount} topic${topicsCount === 1 ? "" : "s"}`,
    `${questionCount} question${questionCount === 1 ? "" : "s"}`,
  ];

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {badges.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ViewerActions({ onOpenEdit }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn-base btn-primary">Follow</button>
      <button className="btn-base btn-neutral">Fork Sheet</button>
      <button className="btn-base btn-neutral">Share</button>
      {onOpenEdit ? (
        <button type="button" onClick={onOpenEdit} className="btn-base btn-neutral">
          Open in Edit Mode
        </button>
      ) : null}
      <button className="btn-base btn-neutral px-3" aria-label="More actions">⋯</button>
    </div>
  );
}

function ReadOnlySheetHeader({ title, topicsCount, questionCount, onOpenEdit }) {
  return (
    <header className="panel-elevated rounded-3xl px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-lg">
              📘
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Public sheet</p>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{title || "Question Sheet"}</h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Curated interview preparation sheet optimized for reading and progress tracking.
          </p>
          <SheetMetaBadges topicsCount={topicsCount} questionCount={questionCount} />
        </div>
        <ViewerActions onOpenEdit={onOpenEdit} />
      </div>
    </header>
  );
}

function SheetOverviewCard({ label, value, accent = "text-[var(--text-primary)]" }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function SheetQuestionTable({ rows }) {
  return (
    <section className="panel overflow-hidden rounded-2xl">
      <div className="border-b border-[var(--border-subtle)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sheet Questions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--surface-elevated)] text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Topic</th>
              <th className="px-4 py-3 font-semibold">Question</th>
              <th className="px-4 py-3 font-semibold">Guide</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-[color-mix(in_srgb,var(--accent-primary)_6%,var(--surface))]">
                  <td className="px-4 py-3.5 text-[var(--text-primary)]">{row.topic}</td>
                  <td className="px-4 py-3.5">{row.question}</td>
                  <td className="px-4 py-3.5">
                    {row.primary ? (
                      <a href={row.primary} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-300 hover:text-blue-200">
                        Open Resource
                      </a>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">No link</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {row.notes ? <span className="text-[var(--text-primary)]">Available</span> : <span className="text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[row.status] || STATUS_STYLES["In Progress"]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-sm text-[var(--text-tertiary)]" colSpan={5}>
                  This sheet has no questions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResourcePanel({ resources }) {
  return (
    <section className="panel rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Resources</h3>
      {resources.length ? (
        <ul className="mt-3 space-y-2">
          {resources.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
              >
                <span className="truncate pr-2">{item.label}</span>
                <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--text-tertiary)]">Link</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-5 text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">No resources yet</p>
          <p className="mt-1 text-[var(--text-tertiary)]">Links and references will appear here once questions include guide URLs.</p>
        </div>
      )}
    </section>
  );
}

function SheetInfoSidebar({ summary, resources, topicsCount, updatedAt, onOpenEdit }) {
  return (
    <aside className="space-y-4">
      <section className="panel rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sheet Overview</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SheetOverviewCard label="Topics" value={topicsCount} />
          <SheetOverviewCard label="Questions" value={summary.tasks} />
          <SheetOverviewCard label="Completed" value={summary.completed} accent="text-emerald-300" />
          <SheetOverviewCard label="Pending" value={summary.pending} accent="text-amber-300" />
          <SheetOverviewCard label="Success" value={summary.successRate} accent="text-blue-300" />
          <SheetOverviewCard label="Updated" value={formatRelativeDate(updatedAt)} />
        </div>
      </section>

      <section className="panel rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick Actions</h3>
        <div className="mt-3 space-y-2">
          <button className="btn-base btn-primary w-full">Follow Sheet</button>
          <button className="btn-base btn-neutral w-full">Fork Sheet</button>
          <button className="btn-base btn-neutral w-full">Share</button>
          {onOpenEdit ? (
            <button type="button" onClick={onOpenEdit} className="btn-base btn-neutral w-full">
              Open in Edit Mode
            </button>
          ) : null}
        </div>
      </section>

      <ResourcePanel resources={resources} />
    </aside>
  );
}

function SheetDashboardView({ title, topics = [], onOpenEdit }) {
  const rows = useMemo(() => getSheetRows(topics), [topics]);

  const summary = useMemo(() => {
    const tasks = rows.length;
    const completed = rows.filter((question) => question.status === "Completed").length;
    const pending = Math.max(tasks - completed, 0);
    const successRate = tasks ? `${Math.round((completed / tasks) * 100)}%` : "0%";
    return { tasks, completed, pending, successRate };
  }, [rows]);

  const resources = useMemo(() => {
    const deduped = new Map();
    rows.forEach((row) => {
      if (!row.primary) return;
      if (!deduped.has(row.primary)) {
        deduped.set(row.primary, { url: row.primary, label: row.question });
      }
    });
    return Array.from(deduped.values()).slice(0, 6);
  }, [rows]);

  return (
    <div className="space-y-5">
      <ReadOnlySheetHeader
        title={title}
        topicsCount={topics.length}
        questionCount={rows.length}
        onOpenEdit={onOpenEdit}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_320px]">
        <SheetQuestionTable rows={rows} />
        <SheetInfoSidebar
          summary={summary}
          resources={resources}
          topicsCount={topics.length}
          updatedAt={null}
          onOpenEdit={onOpenEdit}
        />
      </div>
    </div>
  );
}

export default SheetDashboardView;
