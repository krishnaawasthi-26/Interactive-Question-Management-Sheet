import { useSheetStore } from "../store/sheetStore";

function UndoRedoControls() {
  const undo = useSheetStore((state) => state.undo);
  const redo = useSheetStore((state) => state.redo);
  const canUndo = useSheetStore((state) => state.past.length > 0);
  const canRedo = useSheetStore((state) => state.future.length > 0);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="btn-base btn-neutral px-3 py-1 text-sm"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="btn-base btn-neutral px-3 py-1 text-sm"
      >
        Redo
      </button>
    </div>
  );
}

export default UndoRedoControls;
