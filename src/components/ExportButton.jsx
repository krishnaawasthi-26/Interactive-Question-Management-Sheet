function ExportButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-emerald-600 px-3 py-1 text-sm text-emerald-200 transition hover:bg-emerald-700/20"
    >
      Export
    </button>
  );
}

export default ExportButton;
