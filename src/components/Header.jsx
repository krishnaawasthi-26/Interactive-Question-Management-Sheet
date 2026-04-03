import ExportButton from "./ExportButton";
import UndoRedoControls from "./UndoRedoControls";

function Header({
  isEditing,
  onToggleEdit,
  onOpenImport,
  onOpenExport,
  onLogout,
  title,
  onBackProfile,
  onCreateNewSheet,
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-500 font-bold text-black">
          C
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBackProfile} className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-200">Profile</button>
        <button type="button" onClick={onCreateNewSheet} className="rounded-md border border-orange-600 px-3 py-1 text-sm text-orange-200">New Sheet</button>
        <UndoRedoControls />
        <ExportButton onClick={onOpenExport} />
        <button
          type="button"
          onClick={onOpenImport}
          className="rounded-md border border-sky-600 px-3 py-1 text-sm text-sky-200 transition hover:bg-sky-700/20"
        >
          Import JSON
        </button>
        <button
          onClick={onToggleEdit}
          className="rounded-md border border-gray-700 px-3 py-1 text-sm text-gray-200 transition hover:bg-gray-800"
        >
          {isEditing ? "View Only" : "Edit Sheet"}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border border-rose-700 px-3 py-1 text-sm text-rose-200 transition hover:bg-rose-900/40"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
