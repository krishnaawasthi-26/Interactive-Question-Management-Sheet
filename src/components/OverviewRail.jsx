function Metric({ label, value, accent = "text-[var(--text-primary)]" }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[var(--text-tertiary)]">{label}</span>
      <span className="text-right text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function OverviewRail({ summary, topicsCount, updatedAt }) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-6 xl:h-fit">
      <section className="panel rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Overview</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric label="Topics" value={topicsCount} />
          <Metric label="Questions" value={summary.tasks} />
          <Metric label="Completed" value={summary.completed} accent="metric-accent-success" />
          <Metric label="Pending" value={summary.pending} accent="metric-accent-warning" />
        </div>
      </section>

      <section className="panel rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Progress</h3>
        <div className="mt-3 space-y-2">
          <InfoRow label="Success" value={summary.successRate} />
          <InfoRow label="Recently updated" value={updatedAt} />
        </div>
      </section>

      <section className="panel rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick actions</h3>
        <div className="mt-3 space-y-2">
          <button className="btn-base btn-primary w-full">Follow Sheet</button>
          <button className="btn-base btn-neutral w-full">Fork Sheet</button>
          <button className="btn-base btn-neutral w-full">Share</button>
        </div>
      </section>

      <section className="panel rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sheet info</h3>
        <div className="mt-3 space-y-2">
          <InfoRow label="Owner" value="Sheet author" />
          <InfoRow label="Visibility" value="Public" />
          <InfoRow label="Type" value="Read-only" />
          <InfoRow label="Last updated" value={updatedAt} />
        </div>
      </section>
    </aside>
  );
}

export default OverviewRail;
