function AddTopicForm({ title, onTitleChange, onAdd }) {
  return (
    <section className="mb-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]/70 p-4">
      <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Add Topic</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={title}
          onChange={onTitleChange}
          onKeyDown={(event) => event.key === "Enter" && onAdd()}
          placeholder="Enter topic name"
          className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--btn-accent-primary)]"
        />

        <button
          onClick={onAdd}
          className="rounded-lg bg-[var(--btn-accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--btn-accent-primary-hover)]"
        >
          Add Topic
        </button>
      </div>
    </section>
  );
}

export default AddTopicForm;
