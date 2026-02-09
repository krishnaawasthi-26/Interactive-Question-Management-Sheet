function QuestionSearch({ value, onChange, onlyExactMatch, onExactMatchChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor="question-search">
        Search questions
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          id="question-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type to filter questions..."
          className="w-full bg-transparent border border-gray-700 px-3 py-2 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {/* <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={onlyExactMatch}
            onChange={(event) => onExactMatchChange(event.target.checked)}
            className="h-4 w-4 accent-orange-500"
          />
          Only show questions
        </label> */}
      </div>
    </div>
  );
}

export default QuestionSearch;