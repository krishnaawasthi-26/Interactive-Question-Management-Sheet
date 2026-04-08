function QuestionSearch({ value, onChange }) {
  return (
    <section className="mb-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/70 p-4">
      <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]" htmlFor="question-search">
        Search & filter
      </label>
      <input
        id="question-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search questions or keywords"
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--btn-accent-primary)]"
      />
    </section>
  );
}

export default QuestionSearch;
