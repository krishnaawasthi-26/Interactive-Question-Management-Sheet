import { useState } from "react";

const PRESET_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#8b5cf6", "#64748b", "#f97316"];

function CustomDifficultyModal({ open, onClose, onSave, isSaving = false, error = "" }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8b5cf6");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
      <div className="surface-card w-full max-w-md p-4">
        <h3 className="section-title">Create custom difficulty</h3>
        <input className="field-base mt-3 w-full" placeholder="e.g. Revision" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-3 flex items-center gap-2">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Pick color" />
          <div className="h-5 w-5 rounded-full border border-black" style={{ background: color }} />
          <span className="text-xs text-[var(--text-secondary)]">{color}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button key={preset} type="button" className="h-6 w-6 rounded-full border border-black" style={{ background: preset }} onClick={() => setColor(preset)} />
          ))}
        </div>
        {error ? <p className="mt-2 text-xs text-[var(--accent-danger)]">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-base btn-neutral px-3 py-1.5" onClick={onClose}>Cancel</button>
          <button className="btn-base btn-primary px-3 py-1.5" disabled={isSaving} onClick={() => onSave({ name, color })}>{isSaving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

export default CustomDifficultyModal;
