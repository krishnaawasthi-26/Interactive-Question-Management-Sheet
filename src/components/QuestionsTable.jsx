import { useMemo, useState } from "react";

const STATUS_STYLES = {
  "In Progress": "status-pill--progress",
  "Solve!": "status-pill--pending",
  Completed: "status-pill--completed",
};

function QuestionsTable({ rows }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("topic");
  const [statusFilter, setStatusFilter] = useState("all");

  const normalizedQuery = query.trim().toLowerCase();

  const visibleRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      if (!statusMatch) return false;
      if (!normalizedQuery) return true;

      const haystack = [row.topic, row.question, row.notes, row.primary].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    const comparatorBySort = {
      topic: (a, b) => `${a.topic || ""}`.localeCompare(`${b.topic || ""}`),
      status: (a, b) => `${a.status || ""}`.localeCompare(`${b.status || ""}`),
      question: (a, b) => `${a.question || ""}`.localeCompare(`${b.question || ""}`),
    };

    return filtered.sort(comparatorBySort[sortBy] || comparatorBySort.topic);
  }, [normalizedQuery, rows, sortBy, statusFilter]);

  return (
    <section className="table-shell">
      <div className="table-shell-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="section-title">Questions</h3>
          <p className="meta-text">{visibleRows.length} of {rows.length} questions</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <input
            aria-label="Search questions"
            placeholder="Search questions"
            className="field-base py-2 sm:w-[220px]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select aria-label="Sort" className="field-base py-2 sm:w-auto" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="topic">Sort: Topic</option>
            <option value="status">Status</option>
            <option value="question">Question</option>
          </select>
          <select
            aria-label="Filter"
            className="field-base py-2 sm:w-auto"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All status</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Solve!">Solve!</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table-shell-table">
          <thead className="table-shell-head">
            <tr>
              <th>Topic</th>
              <th>Question</th>
              <th>Guide</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="table-shell-body">
            {visibleRows.length > 0 ? visibleRows.map((row) => (
              <tr key={row.id} className="table-shell-row">
                <td className="table-shell-cell text-[var(--text-primary)]">{row.topic}</td>
                <td className="table-shell-cell leading-6 break-words">{row.question}</td>
                <td className="table-shell-cell">
                  {row.primary ? <a href={row.primary} target="_blank" rel="noreferrer" className="link-base text-sm font-medium">Open Resource</a> : <span className="text-[var(--text-tertiary)]">No link</span>}
                </td>
                <td className="table-shell-cell">{row.notes ? <span className="text-[var(--text-primary)]">Available</span> : <span className="text-[var(--text-tertiary)]">—</span>}</td>
                <td className="table-shell-cell">
                  <span className={`status-pill ${STATUS_STYLES[row.status] || STATUS_STYLES["In Progress"]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="table-shell-cell py-8 text-sm text-[var(--text-tertiary)]" colSpan={5}>This sheet has no questions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default QuestionsTable;
