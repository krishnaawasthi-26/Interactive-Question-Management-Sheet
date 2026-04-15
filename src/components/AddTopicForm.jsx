function AddTopicForm({ title, onTitleChange, onAdd }) {
  return (
    <section className="panel mb-4 p-4 sm:p-5">
      <p className="section-title mb-3">Create Topic</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={title}
          onChange={onTitleChange}
          onKeyDown={(event) => event.key === "Enter" && onAdd()}
          placeholder="Enter topic name"
          className="field-base flex-1"
        />

        <button onClick={onAdd} className="btn-base btn-primary sm:px-4">
          Add Topic
        </button>
      </div>
    </section>
  );
}

export default AddTopicForm;
