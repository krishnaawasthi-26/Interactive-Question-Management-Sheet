const STATUS_STYLES = {
  "In Progress": "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  "Solve!": "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  Completed: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
};

function QuestionsTable({ rows }) {
  return (
    <section className="panel overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Questions</h3>
          <p className="text-xs text-[var(--text-tertiary)]">{rows.length} total questions</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="Search questions" placeholder="Search questions" className="field-base py-2" />
          <select aria-label="Sort" className="field-base py-2">
            <option>Sort: Topic</option>
            <option>Status</option>
            <option>Question</option>
          </select>
          <select aria-label="Filter" className="field-base py-2">
            <option>All status</option>
            <option>Completed</option>
            <option>In Progress</option>
            <option>Solve!</option>
          </select>
        </div>
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
            {rows.length > 0 ? rows.map((row) => (
              <tr key={row.id} className="align-top transition hover:bg-[color-mix(in_srgb,var(--accent-primary)_6%,var(--surface))]">
                <td className="px-4 py-4 text-[var(--text-primary)]">{row.topic}</td>
                <td className="px-4 py-4 leading-6">{row.question}</td>
                <td className="px-4 py-4">
                  {row.primary ? <a href={row.primary} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-300 hover:text-blue-200">Open Resource</a> : <span className="text-[var(--text-tertiary)]">No link</span>}
                </td>
                <td className="px-4 py-4">{row.notes ? <span className="text-[var(--text-primary)]">Available</span> : <span className="text-[var(--text-tertiary)]">—</span>}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[row.status] || STATUS_STYLES["In Progress"]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-8 text-sm text-[var(--text-tertiary)]" colSpan={5}>This sheet has no questions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default QuestionsTable;
