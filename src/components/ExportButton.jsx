function ExportButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-base btn-success px-3 py-1 text-sm"
    >
      Export
    </button>
  );
}

export default ExportButton;
