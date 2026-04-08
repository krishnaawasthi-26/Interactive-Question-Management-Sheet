import { exportSheetAsJson, exportSheetAsPdf } from "../services/sheetExport";
import { useSheetStore } from "../store/sheetStore";
import AppShell from "../components/AppShell";

function ExportPage({ theme, onThemeChange, onBack }) {
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const topics = useSheetStore((state) => state.topics);

  return (
    <AppShell title="Export Sheet" subtitle="Download or print this sheet" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel p-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <button type="button" className="panel-elevated px-4 py-3 text-left" onClick={() => exportSheetAsJson({ sheetTitle, topics })}>
            <p className="font-medium">Export as JSON</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Download raw data for backup/import.</p>
          </button>
          <button type="button" className="panel-elevated px-4 py-3 text-left" onClick={() => exportSheetAsPdf({ sheetTitle, topics })}>
            <p className="font-medium">Export as PDF</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Open print dialog to save a PDF.</p>
          </button>
        </div>
        <button type="button" onClick={onBack} className="btn-base btn-neutral">Back to Sheet</button>
      </div>
    </AppShell>
  );
}

export default ExportPage;
