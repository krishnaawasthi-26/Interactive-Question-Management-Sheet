import { exportSheetAsJson, exportSheetAsPdf } from "../services/sheetExport";
import { useSheetStore } from "../store/sheetStore";
import SiteNav from "../components/SiteNav";

function ExportPage({ onBack }) {
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const topics = useSheetStore((state) => state.topics);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-white">
      <SiteNav />
      <h1 className="mb-4 text-2xl font-semibold">Export Sheet</h1>
      <p className="mb-6 text-sm text-zinc-300">Choose how you want to export this sheet.</p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="rounded-md border border-emerald-600 bg-emerald-900/20 px-4 py-3 text-left"
          onClick={() => exportSheetAsJson({ sheetTitle, topics })}
        >
          <p className="font-medium">Export as JSON</p>
          <p className="mt-1 text-xs text-zinc-300">Download raw data for backup/import.</p>
        </button>

        <button
          type="button"
          className="rounded-md border border-sky-600 bg-sky-900/20 px-4 py-3 text-left"
          onClick={() => exportSheetAsPdf({ sheetTitle, topics })}
        >
          <p className="font-medium">Export as PDF</p>
          <p className="mt-1 text-xs text-zinc-300">Open print dialog to save a PDF.</p>
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="rounded-md border border-gray-700 px-4 py-2 text-sm"
      >
        Back to Sheet
      </button>
    </div>
  );
}

export default ExportPage;
