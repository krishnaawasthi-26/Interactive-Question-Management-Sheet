import { useSheetStore } from "../store/sheetStore";

function ExportButton() {
  const topics = useSheetStore((state) => state.topics);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);

  const exportSheet = () => {
    const payload = {
      id: `sheet_${Date.now()}`,
      name: sheetTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      topics,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sheetTitle.toLowerCase().replace(/\s+/g, "-") || "question-sheet"}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <button
      type="button"
      onClick={exportSheet}
      className="rounded-md border border-emerald-600 px-3 py-1 text-sm text-emerald-200 transition hover:bg-emerald-700/20"
    >
      Export JSON
    </button>
  );
}

export default ExportButton;
