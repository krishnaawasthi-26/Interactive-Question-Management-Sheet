function QuestionSearch({ value, onChange }) {
  return (
    <section className="panel mb-5 p-4 sm:p-5">
      <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]" htmlFor="question-search">
        Search & filter
      </label>
      <input
        id="question-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search questions or keywords"
        className="field-base w-full"
      />
    </section>
  );
}

export default QuestionSearch;
