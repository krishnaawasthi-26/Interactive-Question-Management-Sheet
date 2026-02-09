function AddTopicForm({ title, onTitleChange, onAdd }) {
  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-gray-800 rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex gap-3">
        <input
          value={title}
          onChange={onTitleChange}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder="Enter topic name"
          className="border p-2 rounded w-64 bg-transparent text-white placeholder-gray-400"
        />

        <button
          onClick={onAdd}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md shadow-sm transition"
        >
          Add Topic
        </button>
      </div>
    </div>
  );
}

export default AddTopicForm;
