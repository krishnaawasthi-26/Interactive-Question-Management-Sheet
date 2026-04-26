import { useEffect, useState } from "react";
import { pickDistinctColor } from "../services/topicTags";

const PRESETS = ["#6366f1", "#f97316", "#14b8a6", "#ec4899", "#22c55e", "#facc15", "#8b5cf6", "#ef4444"];

function CustomTopicModal({ open, onClose, onSave, existingColors = [], initialValue = null }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESETS[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialValue?.name || "");
    setColor(initialValue?.color || pickDistinctColor(existingColors, existingColors.length));
    setError("");
  }, [existingColors, initialValue, open]);

  if (!open) return null;

  return (
    <div className="overlay-shell">
      <div className="overlay-panel max-w-md space-y-3 p-4">
        <h3 className="section-title">{initialValue ? "Edit custom topic" : "Add custom topic"}</h3>
        <input className="field-base w-full" placeholder="Topic name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="space-y-2">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full" />
          <div className="flex flex-wrap gap-2">{PRESETS.map((preset) => <button key={preset} type="button" className="h-6 w-6 rounded-full border" style={{ background: preset }} onClick={() => setColor(preset)} />)}</div>
        </div>
        {error ? <p className="text-xs text-[var(--accent-danger)]">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-base btn-neutral px-3 py-1" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-base btn-primary px-3 py-1" onClick={() => {
            if (!name.trim()) {
              setError("Topic name is required.");
              return;
            }
            onSave({ name: name.trim(), color });
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default CustomTopicModal;
