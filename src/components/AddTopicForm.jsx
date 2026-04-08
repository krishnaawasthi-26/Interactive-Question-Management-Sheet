function AddTopicForm({ title, onTitleChange, onAdd }) {
  return (
    <section className="panel mb-4 p-4">
      <p className="mb-3 text-sm font-semibold">Create Topic</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={title}
          onChange={onTitleChange}
          onKeyDown={(event) => event.key === "Enter" && onAdd()}
          placeholder="Enter topic name"
          className="field-base flex-1"
        />

        <button onClick={onAdd} className="btn-base btn-primary">
          Add Topic
        </button>
      </div>
    </section>
  );
}

export default AddTopicForm;
